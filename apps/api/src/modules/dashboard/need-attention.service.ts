import { Injectable } from '@nestjs/common';
import {
  NeedAttentionItem,
  NeedAttentionSeverity,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

@Injectable()
export class NeedAttentionService {
  constructor(private readonly prisma: PrismaService) {}

  async scan(userId: string): Promise<{
    total_count: number;
    critical_count: number;
    warning_count: number;
    attention_count: number;
    items: NeedAttentionItem[];
  }> {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Run parallel queries
    const [tasks, milestones, projects, followUps] = await Promise.all([
      // 1. Tasks potentially overdue or urgent
      this.prisma.task.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),

      // 2. Milestones of active projects
      this.prisma.milestone.findMany({
        where: {
          deleted_at: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          project: {
            owner_id: userId,
            deleted_at: null,
            status: { in: ['ACTIVE', 'PLANNING', 'AT_RISK'] },
          },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),

      // 3. Active projects with potential health risks
      this.prisma.project.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: { in: ['ACTIVE', 'PLANNING', 'AT_RISK'] },
          OR: [
            { health_status: { in: ['RED', 'YELLOW'] } },
            { status: 'AT_RISK' },
          ],
        },
      }),

      // 4. Pending follow-ups
      this.prisma.followUp.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: 'WAITING',
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const items: NeedAttentionItem[] = [];

    // =========================================================================
    // Rule 1: Task quá hạn > 2 ngày hoặc task độ ưu tiên CRITICAL bị kẹt
    // =========================================================================
    for (const t of tasks) {
      let isFlagged = false;

      if (t.due_date) {
        const dueDate = new Date(t.due_date);
        const diffMs = today.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 2) {
          isFlagged = true;
          const severity: NeedAttentionSeverity =
            diffDays >= 5 || t.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING';

          items.push({
            id: `task-overdue-${t.id}`,
            rule_code: 'RULE_TASK_OVERDUE_OR_URGENT',
            severity,
            title: t.title,
            reason: `Công việc đã quá hạn ${diffDays} ngày (Hạn chót: ${formatDate(
              dueDate,
            )}) mà chưa hoàn thành.`,
            entity_type: 'TASK',
            entity_id: t.id,
            project_id: t.project_id,
            project_name: t.project?.name,
            detected_at: now.toISOString(),
            action_hint: 'Cập nhật trạng thái hoặc dời hạn sang ngày mai.',
            metadata: { diff_days: diffDays, status: t.status, priority: t.priority },
          });
        }
      }

      if (!isFlagged && t.priority === 'CRITICAL') {
        // Critical task stuck
        items.push({
          id: `task-urgent-stuck-${t.id}`,
          rule_code: 'RULE_TASK_OVERDUE_OR_URGENT',
          severity: 'CRITICAL',
          title: t.title,
          reason: `Công việc mức Khẩn cấp (CRITICAL) đang ở trạng thái "${t.status}" cần được ưu tiên tháo gỡ.`,
          entity_type: 'TASK',
          entity_id: t.id,
          project_id: t.project_id,
          project_name: t.project?.name,
          detected_at: now.toISOString(),
          action_hint: 'Rà soát vướng mắc kỹ thuật và ưu tiên hoàn thành sớm.',
          metadata: { status: t.status, priority: t.priority },
        });
      }
    }

    // =========================================================================
    // Rule 2: Cột mốc sắp đến hạn trong 3 ngày nhưng tiến độ < 50%
    // =========================================================================
    for (const m of milestones) {
      const targetDate = new Date(m.target_date);
      const diffMs = targetDate.getTime() - today.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Overdue (diffDays < 0) or due within 3 days (0 <= diffDays <= 3) and progress < 50
      if (diffDays <= 3 && m.progress < 50) {
        const severity: NeedAttentionSeverity = diffDays < 0 ? 'CRITICAL' : 'WARNING';
        const reason =
          diffDays < 0
            ? `Cột mốc đã quá hạn ${Math.abs(diffDays)} ngày nhưng tiến độ mới đạt ${
                m.progress
              }%.`
            : `Cột mốc đến hạn trong ${
                diffDays === 0 ? 'hôm nay' : `${diffDays} ngày tới`
              } nhưng tiến độ mới đạt ${m.progress}%.`;

        items.push({
          id: `milestone-risk-${m.id}`,
          rule_code: 'RULE_MILESTONE_AT_RISK',
          severity,
          title: m.title,
          reason,
          entity_type: 'MILESTONE',
          entity_id: m.id,
          project_id: m.project_id,
          project_name: m.project.name,
          detected_at: now.toISOString(),
          action_hint: 'Rà soát khối lượng công việc và kiểm tra các task phụ thuộc.',
          metadata: { diff_days: diffDays, progress: m.progress },
        });
      }
    }

    // =========================================================================
    // Rule 3: Dự án có health_status = RED hoặc YELLOW hoặc status = AT_RISK
    // =========================================================================
    for (const p of projects) {
      if (p.health_status === 'RED') {
        items.push({
          id: `project-red-${p.id}`,
          rule_code: 'RULE_PROJECT_HEALTH_RISK',
          severity: 'CRITICAL',
          title: p.name,
          reason: `Dự án [${p.code}] đang ở mức báo động ĐỎ (RED) - Cần can thiệp khẩn cấp.`,
          entity_type: 'PROJECT',
          entity_id: p.id,
          project_id: p.id,
          project_name: p.name,
          detected_at: now.toISOString(),
          action_hint: 'Rà soát các rủi ro quan trọng và tái phân bổ nguồn lực.',
          metadata: { health: p.health_status, status: p.status, progress: p.manual_progress },
        });
      } else if (p.health_status === 'YELLOW' || p.status === 'AT_RISK') {
        items.push({
          id: `project-yellow-${p.id}`,
          rule_code: 'RULE_PROJECT_HEALTH_RISK',
          severity: 'WARNING',
          title: p.name,
          reason: `Dự án [${p.code}] có cảnh báo sức khỏe (${p.health_status} / ${p.status}) về tiến độ hoặc khối lượng.`,
          entity_type: 'PROJECT',
          entity_id: p.id,
          project_id: p.id,
          project_name: p.name,
          detected_at: now.toISOString(),
          action_hint: 'Theo dõi sát tiến độ các mốc tiếp theo.',
          metadata: { health: p.health_status, status: p.status, progress: p.manual_progress },
        });
      }
    }

    // =========================================================================
    // Rule 4: Follow-up chờ quá 3 ngày chưa được giải quyết
    // =========================================================================
    for (const fu of followUps) {
      const fuDate = new Date(fu.follow_up_date);
      const diffMs = today.getTime() - fuDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 3) {
        const severity: NeedAttentionSeverity = diffDays >= 7 ? 'CRITICAL' : 'WARNING';
        items.push({
          id: `followup-delayed-${fu.id}`,
          rule_code: 'RULE_FOLLOWUP_DELAYED',
          severity,
          title: fu.title,
          reason: `Chờ phản hồi từ "${fu.waiting_for}" đã quá ${diffDays} ngày (từ ${formatDate(
            fuDate,
          )}) mà chưa có kết quả.`,
          entity_type: 'FOLLOW_UP',
          entity_id: fu.id,
          project_id: fu.project_id,
          project_name: fu.project?.name,
          detected_at: now.toISOString(),
          action_hint: 'Chủ động liên hệ thúc đẩy phản hồi hoặc cập nhật trạng thái.',
          metadata: { delayed_days: diffDays, waiting_for: fu.waiting_for },
        });
      }
    }

    // Sort: CRITICAL first, then WARNING, then ATTENTION
    const severityWeight: Record<NeedAttentionSeverity, number> = {
      CRITICAL: 3,
      WARNING: 2,
      ATTENTION: 1,
    };

    items.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    const criticalCount = items.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = items.filter((i) => i.severity === 'WARNING').length;
    const attentionCount = items.filter((i) => i.severity === 'ATTENTION').length;

    return {
      total_count: items.length,
      critical_count: criticalCount,
      warning_count: warningCount,
      attention_count: attentionCount,
      items,
    };
  }
}
