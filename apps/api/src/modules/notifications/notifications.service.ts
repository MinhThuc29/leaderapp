import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, NotificationType, Priority, TaskStatus, MeetingStatus, RiskStatus, DecisionStatus, FollowUpStatus } from '@prisma/client';
import { NotificationDto, NotificationListResponse } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: {
    meeting: {
      include: {
        project: { select: { id: true; name: true; code: true } };
        member: true;
      };
    };
    task: {
      include: {
        project: { select: { id: true; name: true; code: true } };
        assignee: true;
      };
    };
    risk: true;
    decision: true;
    follow_up: true;
  };
}>;

function formatDisplayDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách thông báo và tự động đồng bộ cảnh báo từ dữ liệu SQL thực tế
   */
  async findAll(userId: string, query?: QueryNotificationDto): Promise<NotificationListResponse> {
    // 1. Đồng bộ dữ liệu thật từ các bảng SQL (Tasks quá hạn, Cuộc họp sắp tới, Rủi ro, Quyết định)
    await this.syncRealEntitiesToNotifications(userId);

    // 2. Chuẩn bị bộ lọc
    const where: Prisma.NotificationWhereInput = {
      user_id: userId,
    };

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.unread === 'true') {
      where.read = false;
    } else if (query?.unread === 'false') {
      where.read = true;
    }

    // 3. Truy vấn dữ liệu thông báo với các quan hệ SQL thật
    const notifications = await this.prisma.notification.findMany({
      where,
      include: {
        meeting: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            member: true,
          },
        },
        task: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            assignee: true,
          },
        },
        risk: true,
        decision: true,
        follow_up: true,
      },
      orderBy: [{ read: 'asc' }, { created_at: 'desc' }],
    });

    // 4. Tính toán thống kê theo dữ liệu SQL thật
    const allUserNotifs = await this.prisma.notification.findMany({
      where: { user_id: userId },
      select: { read: true, type: true },
    });

    const total = allUserNotifs.length;
    const unread = allUserNotifs.filter((n) => !n.read).length;
    const overdue = allUserNotifs.filter((n) => n.type === NotificationType.OVERDUE).length;
    const meeting = allUserNotifs.filter((n) => n.type === NotificationType.MEETING).length;

    return {
      items: notifications.map((n) => this.mapToDto(n)),
      stats: {
        total,
        unread,
        overdue,
        meeting,
      },
    };
  }

  /**
   * Đánh dấu hoặc đảo trạng thái đọc
   */
  async toggleRead(userId: string, id: string): Promise<NotificationDto> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: !existing.read },
      include: {
        meeting: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            member: true,
          },
        },
        task: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            assignee: true,
          },
        },
        risk: true,
        decision: true,
        follow_up: true,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Xoá / Huỷ thông báo
   */
  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }

    await this.prisma.notification.delete({ where: { id } });
  }

  /**
   * Logic cốt lõi: Rà soát các bản ghi SQL thực tế trong hệ thống và sinh thông báo tương ứng
   * nếu bản ghi đó chưa được thông báo.
   */
  async syncRealEntitiesToNotifications(userId: string): Promise<void> {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // 1. Quét Tasks thực tế trong CSDL bị quá hạn
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        due_date: { lt: today },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
      include: {
        project: { select: { name: true, code: true } },
      },
      take: 10,
    });

    for (const t of overdueTasks) {
      const existing = await this.prisma.notification.findFirst({
        where: { user_id: userId, task_id: t.id, type: NotificationType.OVERDUE },
      });

      if (!existing && t.due_date) {
        const dueDate = new Date(t.due_date);
        const diffDays = Math.max(
          1,
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
        const projName = t.project?.name ? `Dự án ${t.project.name}: ` : '';

        await this.prisma.notification.create({
          data: {
            user_id: userId,
            type: NotificationType.OVERDUE,
            title: `Nhiệm vụ quá hạn: ${t.title}`,
            description: `${projName}Hạn chót ngày ${formatDisplayDate(dueDate)}, hiện tại chưa hoàn thành.`,
            priority: t.priority === Priority.CRITICAL || diffDays >= 3 ? Priority.HIGH : Priority.MEDIUM,
            read: false,
            action_url: '/tasks',
            action_label: 'Xem công việc',
            time_hint: `Quá hạn ${diffDays} ngày`,
            entity_type: 'TASK',
            task_id: t.id,
          },
        });
      }
    }

    // 2. Quét Cuộc họp thực tế trong CSDL (Upcoming hoặc In-Progress)
    const upcomingMeetings = await this.prisma.meeting.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        status: { in: [MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS] },
      },
      include: {
        member: { select: { name: true, role: true } },
        project: { select: { name: true } },
      },
      take: 10,
    });

    for (const m of upcomingMeetings) {
      const existing = await this.prisma.notification.findFirst({
        where: { user_id: userId, meeting_id: m.id, type: NotificationType.MEETING },
      });

      if (!existing) {
        const mTime = new Date(m.start_time);
        const hours = String(mTime.getHours()).padStart(2, '0');
        const minutes = String(mTime.getMinutes()).padStart(2, '0');
        const isSameDay =
          mTime.getDate() === now.getDate() &&
          mTime.getMonth() === now.getMonth() &&
          mTime.getFullYear() === now.getFullYear();

        const timeHint = isSameDay
          ? `Hôm nay lúc ${hours}:${minutes}`
          : `${formatDisplayDate(mTime)} lúc ${hours}:${minutes}`;

        let desc = m.description ?? '';
        if (m.member) {
          desc = `Với ${m.member.name} (${m.member.role}). ` + (m.location ? `Địa điểm: ${m.location}` : '');
        } else if (m.location) {
          desc = desc ? `${desc} - ${m.location}` : `Địa điểm: ${m.location}`;
        }

        await this.prisma.notification.create({
          data: {
            user_id: userId,
            type: NotificationType.MEETING,
            title: m.title,
            description: desc || 'Cuộc họp quan trọng đã lên lịch.',
            priority: Priority.HIGH,
            read: false,
            action_url: m.member_id ? '/members' : '/weekly',
            action_label: m.meeting_url ? 'Tham gia Meet' : 'Xem chi tiết',
            time_hint: timeHint,
            entity_type: 'MEETING',
            meeting_id: m.id,
          },
        });
      }
    }

    // 3. Quét Rủi ro thực tế trong CSDL ở mức độ CRITICAL hoặc HIGH
    const criticalRisks = await this.prisma.risk.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        status: { in: [RiskStatus.OPEN, RiskStatus.MONITORING] },
        severity: { in: [Priority.CRITICAL, Priority.HIGH] },
      },
      include: {
        project: { select: { name: true } },
      },
      take: 5,
    });

    for (const r of criticalRisks) {
      const existing = await this.prisma.notification.findFirst({
        where: { user_id: userId, risk_id: r.id, type: NotificationType.RISK },
      });

      if (!existing) {
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            type: NotificationType.RISK,
            title: `Rủi ro báo động: ${r.title}`,
            description: `Dự án ${r.project.name}: Mức độ nghiêm trọng ${r.severity}, xác suất ${r.probability}.`,
            priority: Priority.CRITICAL,
            read: false,
            action_url: '/management/risks',
            action_label: 'Xem ma trận rủi ro',
            time_hint: 'Cần chú ý ngay',
            entity_type: 'RISK',
            risk_id: r.id,
          },
        });
      }
    }

    // 4. Quét Quyết định thực tế trong CSDL cần review
    const pendingDecisions = await this.prisma.decision.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        status: DecisionStatus.REVIEW_PENDING,
      },
      include: {
        project: { select: { name: true } },
      },
      take: 5,
    });

    for (const d of pendingDecisions) {
      const existing = await this.prisma.notification.findFirst({
        where: { user_id: userId, decision_id: d.id, type: NotificationType.DECISION },
      });

      if (!existing) {
        const reviewDate = d.review_date ? formatDisplayDate(new Date(d.review_date)) : 'Hôm nay';
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            type: NotificationType.DECISION,
            title: `Đến hạn đánh giá lại: ${d.title}`,
            description: `Rà soát đối chiếu kết quả thực tế với kỳ vọng ban đầu. Hạn review: ${reviewDate}`,
            priority: Priority.MEDIUM,
            read: false,
            action_url: '/management/decisions',
            action_label: 'Đánh giá quyết định',
            time_hint: `Hạn: ${reviewDate}`,
            entity_type: 'DECISION',
            decision_id: d.id,
          },
        });
      }
    }

    // 5. Quét Follow-ups thực tế bị quá hạn
    const overdueFollowUps = await this.prisma.followUp.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        status: FollowUpStatus.WAITING,
        follow_up_date: { lt: today },
      },
      include: {
        member: { select: { name: true } },
      },
      take: 5,
    });

    for (const f of overdueFollowUps) {
      const existing = await this.prisma.notification.findFirst({
        where: { user_id: userId, follow_up_id: f.id },
      });

      if (!existing) {
        const fDate = new Date(f.follow_up_date);
        const diffDays = Math.max(
          1,
          Math.floor((today.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
        const waitingTarget = f.member?.name ?? f.waiting_for;

        await this.prisma.notification.create({
          data: {
            user_id: userId,
            type: NotificationType.OVERDUE,
            title: `Chờ phản hồi quá hạn: ${f.title}`,
            description: `Đang đợi phản hồi từ ${waitingTarget} (${f.note || 'Chưa nhận được phản hồi'}).`,
            priority: Priority.MEDIUM,
            read: false,
            action_url: '/today',
            action_label: 'Xử lý ngay',
            time_hint: `Quá hạn ${diffDays} ngày`,
            entity_type: 'FOLLOW_UP',
            follow_up_id: f.id,
          },
        });
      }
    }
  }

  private mapToDto(n: NotificationWithRelations): NotificationDto {
    return {
      id: n.id,
      user_id: n.user_id,
      type: n.type.toLowerCase() as NotificationDto['type'],
      title: n.title,
      description: n.description,
      priority: n.priority.toLowerCase() as NotificationDto['priority'],
      read: n.read,
      action_url: n.action_url,
      action_label: n.action_label,
      time_hint: n.time_hint,
      entity_type: n.entity_type,
      task_id: n.task_id,
      meeting_id: n.meeting_id,
      risk_id: n.risk_id,
      decision_id: n.decision_id,
      follow_up_id: n.follow_up_id,
      created_at: n.created_at.toISOString(),
      updated_at: n.updated_at.toISOString(),
      meeting: n.meeting
        ? {
            id: n.meeting.id,
            title: n.meeting.title,
            description: n.meeting.description,
            location: n.meeting.location,
            meeting_url: n.meeting.meeting_url,
            start_time: n.meeting.start_time.toISOString(),
            end_time: n.meeting.end_time ? n.meeting.end_time.toISOString() : null,
            status: n.meeting.status,
            agenda: n.meeting.agenda,
            notes: n.meeting.notes,
            project_id: n.meeting.project_id,
            member_id: n.meeting.member_id,
            owner_id: n.meeting.owner_id,
            created_at: n.meeting.created_at.toISOString(),
            updated_at: n.meeting.updated_at.toISOString(),
            project: n.meeting.project
              ? { id: n.meeting.project.id, name: n.meeting.project.name, code: n.meeting.project.code }
              : undefined,
            member: n.meeting.member
              ? {
                  id: n.meeting.member.id,
                  name: n.meeting.member.name,
                  nickname: n.meeting.member.nickname,
                  role: n.meeting.member.role,
                  level: n.meeting.member.level,
                  email: n.meeting.member.email,
                  phone: n.meeting.member.phone,
                  active: n.meeting.member.active,
                  notes: n.meeting.member.notes,
                  created_at: n.meeting.member.created_at.toISOString(),
                  updated_at: n.meeting.member.updated_at.toISOString(),
                }
              : undefined,
          }
        : undefined,
    };
  }
}
