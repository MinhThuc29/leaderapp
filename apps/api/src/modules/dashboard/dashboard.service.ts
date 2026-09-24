import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DashboardProjectItemDto,
  DashboardSummaryDto,
  FollowUpDto,
  HealthStatus,
  NeedAttentionItem,
  Priority,
  ProjectStatus,
  WeeklyPlanDto,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NeedAttentionService } from './need-attention.service';
import { WeeklyPlansService } from '../weekly-plans/weekly-plans.service';

type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: {
    project_members: {
      select: { id: true };
    };
    tasks: {
      select: { id: true; status: true; due_date: true };
    };
  };
}>;

type FollowUpWithDetails = Prisma.FollowUpGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    member: { select: { id: true; name: true } };
  };
}>;

function getISOWeekAndYear(d = new Date()): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly needAttentionService: NeedAttentionService,
    private readonly weeklyPlansService: WeeklyPlansService,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const { year: currentYear, week: currentWeek } = getISOWeekAndYear(now);

    // Parallel queries for sub-50ms execution
    const [
      tasksTodayCount,
      tasksOverdueCount,
      tasksCompletedTodayCount,
      pendingFollowUpsCount,
      activeProjectsRaw,
      weeklyPlans,
      pendingFollowUpsRaw,
      needAttention,
    ]: [
      number,
      number,
      number,
      number,
      ProjectWithDetails[],
      WeeklyPlanDto[],
      FollowUpWithDetails[],
      {
        total_count: number;
        critical_count: number;
        warning_count: number;
        attention_count: number;
        items: NeedAttentionItem[];
      },
    ] = await Promise.all([
      // Tasks due today
      this.prisma.task.count({
        where: {
          owner_id: userId,
          deleted_at: null,
          due_date: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),

      // Tasks overdue
      this.prisma.task.count({
        where: {
          owner_id: userId,
          deleted_at: null,
          due_date: { lt: today },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),

      // Tasks completed today
      this.prisma.task.count({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: 'DONE',
          completed_at: { gte: today, lt: tomorrow },
        },
      }),

      // Pending follow-ups count
      this.prisma.followUp.count({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: 'WAITING',
        },
      }),

      // Active projects with member count & tasks stats
      this.prisma.project.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: { in: ['ACTIVE', 'PLANNING', 'AT_RISK'] },
        },
        include: {
          project_members: {
            where: { left_at: null },
            select: { id: true },
          },
          tasks: {
            where: { deleted_at: null },
            select: { id: true, status: true, due_date: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      }),

      // Current week plans
      this.weeklyPlansService.findAll(userId, {
        year: currentYear,
        week: currentWeek,
      }),

      // Top 5 pending follow-ups
      this.prisma.followUp.findMany({
        where: {
          owner_id: userId,
          deleted_at: null,
          status: 'WAITING',
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          member: { select: { id: true, name: true } },
        },
        orderBy: [{ follow_up_date: 'asc' }],
        take: 5,
      }),

      // Need Attention scan
      this.needAttentionService.scan(userId),
    ]);

    // Format active projects
    const activeProjects: DashboardProjectItemDto[] = activeProjectsRaw.map((p) => {
      const openTasks = p.tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
      const overdueTasks = openTasks.filter((t) => t.due_date && new Date(t.due_date) < today);

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status as ProjectStatus,
        progress: p.manual_progress,
        health_status: p.health_status as HealthStatus,
        priority: p.priority as Priority,
        target_date: p.target_date ? p.target_date.toISOString() : null,
        members_count: p.project_members.length,
        open_tasks_count: openTasks.length,
        overdue_tasks_count: overdueTasks.length,
      };
    });

    // Calculate weekly summary stats
    const totalWeeklyPlans = weeklyPlans.length;
    let totalWeeklyTasks = 0;
    let completedWeeklyTasks = 0;
    for (const wp of weeklyPlans) {
      totalWeeklyTasks += wp.total_tasks;
      completedWeeklyTasks += wp.completed_tasks;
    }
    const weeklyCompletionRate =
      totalWeeklyTasks > 0 ? Math.round((completedWeeklyTasks / totalWeeklyTasks) * 100) : 0;

    // Format pending follow-ups
    const pendingFollowUps: FollowUpDto[] = pendingFollowUpsRaw.map((fu) => ({
      id: fu.id,
      title: fu.title,
      waiting_for: fu.waiting_for,
      follow_up_date: fu.follow_up_date.toISOString(),
      status: fu.status,
      project_id: fu.project_id,
      project_name: fu.project?.name,
      member_id: fu.member_id,
      member_name: fu.member?.name,
      note: fu.note,
      owner_id: fu.owner_id,
      created_at: fu.created_at.toISOString(),
      updated_at: fu.updated_at.toISOString(),
    }));

    return {
      today_summary: {
        tasks_today_count: tasksTodayCount,
        overdue_tasks_count: tasksOverdueCount,
        completed_today_count: tasksCompletedTodayCount,
        pending_follow_ups_count: pendingFollowUpsCount,
      },
      active_projects: activeProjects,
      weekly_summary: {
        week_number: currentWeek,
        year: currentYear,
        total_plans: totalWeeklyPlans,
        total_tasks: totalWeeklyTasks,
        completed_tasks: completedWeeklyTasks,
        completion_rate: weeklyCompletionRate,
        plans: weeklyPlans,
      },
      pending_follow_ups: pendingFollowUps,
      need_attention: needAttention,
    };
  }
}
