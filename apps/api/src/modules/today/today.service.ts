import { Injectable } from '@nestjs/common';
import { FollowUpStatus, Prisma, TaskStatus } from '@prisma/client';
import {
  FollowUpDto,
  MemberDto,
  NoteDto,
  TaskDto,
  TodayResponseDto,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    assignee: true;
    milestone: { select: { id: true; title: true; status: true } };
  };
}>;

type FollowUpWithRelations = Prisma.FollowUpGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    member: true;
  };
}>;

type NoteWithRelations = Prisma.NoteGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    member: true;
  };
}>;

@Injectable()
export class TodayService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodaySummary(userId: string): Promise<TodayResponseDto> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const today = new Date(`${todayStr}T00:00:00.000Z`);

    const startOfTodayLocal = new Date(now);
    startOfTodayLocal.setHours(0, 0, 0, 0);

    const endOfTodayLocal = new Date(now);
    endOfTodayLocal.setHours(23, 59, 59, 999);

    // Truy vấn song song 3 khối dữ liệu để tối ưu hiệu năng tối đa
    const [tasks, followUps, notes] = await Promise.all([
      // 1. Toàn bộ task liên quan đến hôm nay (hạn hôm nay, quá hạn dở dang, hoặc đã hoàn thành hôm nay)
      this.prisma.task.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          OR: [
            { due_date: today },
            {
              due_date: { lt: today },
              status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
            },
            {
              status: TaskStatus.DONE,
              completed_at: { gte: startOfTodayLocal, lte: endOfTodayLocal },
            },
          ],
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          assignee: true,
          milestone: { select: { id: true, title: true, status: true } },
        },
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      }),

      // 2. Follow-ups đang chờ phản hồi
      this.prisma.followUp.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: FollowUpStatus.WAITING,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          member: true,
        },
        orderBy: [{ follow_up_date: 'asc' }],
        take: 30,
      }),

      // 3. Quick notes gần đây
      this.prisma.note.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          member: true,
        },
        orderBy: [{ created_at: 'desc' }],
        take: 5,
      }),
    ]);

    // Phân loại in-memory các mảng tasks
    const overdueList: TaskDto[] = [];
    const todayList: TaskDto[] = [];
    const completedList: TaskDto[] = [];

    for (const t of tasks) {
      const dto = this.mapTaskToDto(t, today);
      const isCompleted = t.status === TaskStatus.DONE;

      if (isCompleted) {
        completedList.push(dto);
      } else if (t.due_date && new Date(t.due_date) < today) {
        overdueList.push(dto);
      } else {
        todayList.push(dto);
      }
    }

    const followUpDtos = followUps.map((f) => this.mapFollowUpToDto(f, today));
    const noteDtos = notes.map((n) => this.mapNoteToDto(n));

    const totalTasksToday = overdueList.length + todayList.length + completedList.length;
    const completedTasksToday = completedList.length;
    const completionPercentage =
      totalTasksToday > 0
        ? Math.round((completedTasksToday / totalTasksToday) * 100)
        : 0;

    const dayNames = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];
    const dayOfWeek = dayNames[now.getDay()] ?? '';
    const formattedDate = `${dayOfWeek}, ${dd}/${mm}/${yyyy}`;

    return {
      date: todayStr,
      formatted_date: formattedDate,
      stats: {
        total_tasks_today: totalTasksToday,
        completed_tasks_today: completedTasksToday,
        overdue_tasks_count: overdueList.length,
        pending_follow_ups_count: followUpDtos.length,
        completion_percentage: completionPercentage,
      },
      overdue_tasks: overdueList,
      today_tasks: todayList,
      completed_today_tasks: completedList,
      pending_follow_ups: followUpDtos,
      recent_quick_notes: noteDtos,
    };
  }

  private toDateString(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0] ?? '';
  }

  private mapTaskToDto(
    task: TaskWithRelations,
    today: Date,
  ): TaskDto {
    const isOverdue =
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED &&
      task.due_date !== null &&
      new Date(task.due_date) < today;

    let assigneeDto: MemberDto | undefined = undefined;
    if (task.assignee) {
      assigneeDto = {
        id: task.assignee.id,
        name: task.assignee.name,
        nickname: task.assignee.nickname,
        role: task.assignee.role,
        level: task.assignee.level,
        email: task.assignee.email,
        phone: task.assignee.phone,
        active: task.assignee.active,
        notes: task.assignee.notes,
        created_at: task.assignee.created_at.toISOString(),
        updated_at: task.assignee.updated_at.toISOString(),
      };
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: this.toDateString(task.due_date),
      due_time: task.due_time,
      weight: task.weight,
      completed_at: task.completed_at ? task.completed_at.toISOString() : null,
      project_id: task.project_id,
      member_id: task.member_id,
      milestone_id: task.milestone_id,
      owner_id: task.owner_id,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
      is_overdue: isOverdue,
      assignee: assigneeDto,
      project: task.project
        ? { id: task.project.id, name: task.project.name, code: task.project.code }
        : undefined,
      milestone: task.milestone
        ? {
            id: task.milestone.id,
            title: task.milestone.title,
            status: task.milestone.status,
          }
        : undefined,
    };
  }

  private mapFollowUpToDto(
    followUp: FollowUpWithRelations,
    today: Date,
  ): FollowUpDto {
    const isOverdue =
      followUp.status === FollowUpStatus.WAITING &&
      new Date(followUp.follow_up_date) < today;

    let memberDto: MemberDto | undefined = undefined;
    if (followUp.member) {
      memberDto = {
        id: followUp.member.id,
        name: followUp.member.name,
        nickname: followUp.member.nickname,
        role: followUp.member.role,
        level: followUp.member.level,
        email: followUp.member.email,
        phone: followUp.member.phone,
        active: followUp.member.active,
        notes: followUp.member.notes,
        created_at: followUp.member.created_at.toISOString(),
        updated_at: followUp.member.updated_at.toISOString(),
      };
    }

    return {
      id: followUp.id,
      title: followUp.title,
      waiting_for: followUp.waiting_for,
      follow_up_date: this.toDateString(followUp.follow_up_date),
      status: followUp.status,
      project_id: followUp.project_id,
      member_id: followUp.member_id,
      note: followUp.note,
      owner_id: followUp.owner_id,
      created_at: followUp.created_at.toISOString(),
      updated_at: followUp.updated_at.toISOString(),
      is_overdue: isOverdue,
      project: followUp.project
        ? {
            id: followUp.project.id,
            name: followUp.project.name,
            code: followUp.project.code,
          }
        : undefined,
      member: memberDto,
    };
  }

  private mapNoteToDto(note: NoteWithRelations): NoteDto {
    let memberDto: MemberDto | undefined = undefined;
    if (note.member) {
      memberDto = {
        id: note.member.id,
        name: note.member.name,
        nickname: note.member.nickname,
        role: note.member.role,
        level: note.member.level,
        email: note.member.email,
        phone: note.member.phone,
        active: note.member.active,
        notes: note.member.notes,
        created_at: note.member.created_at.toISOString(),
        updated_at: note.member.updated_at.toISOString(),
      };
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      type: note.type,
      project_id: note.project_id,
      member_id: note.member_id,
      is_pinned: note.is_pinned,
      source: note.source,
      converted_to: note.converted_to,
      owner_id: note.owner_id,
      created_at: note.created_at.toISOString(),
      updated_at: note.updated_at.toISOString(),
      project: note.project
        ? { id: note.project.id, name: note.project.name, code: note.project.code }
        : undefined,
      member: memberDto,
    };
  }
}
