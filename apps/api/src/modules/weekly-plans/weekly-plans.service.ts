import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  WeeklyPlanDto,
  WeeklyPlanStatus,
  WeeklyReviewDto,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWeeklyPlanDto } from './dto/create-weekly-plan.dto';
import { UpdateWeeklyPlanDto } from './dto/update-weekly-plan.dto';
import { AssignWeeklyTasksDto } from './dto/assign-weekly-tasks.dto';
import { CreateWeeklyReviewDto } from './dto/create-weekly-review.dto';
import { QueryWeeklyPlanDto } from './dto/query-weekly-plan.dto';

type WeeklyPlanWithRelations = Prisma.WeeklyPlanGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    weekly_plan_tasks: {
      include: {
        task: {
          include: {
            assignee: true;
          };
        };
      };
    };
    weekly_review: true;
  };
}>;

export function getWeekDateRange(year: number, week: number): { startDate: Date; endDate: Date } {
  // Simple ISO week calculator
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  const startDate = new Date(ISOweekStart);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  endDate.setUTCHours(23, 59, 59, 999);
  return { startDate, endDate };
}

@Injectable()
export class WeeklyPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWeeklyPlanDto): Promise<WeeklyPlanDto> {
    const goalText = (dto.goal ?? dto.goals ?? '').trim();
    if (!goalText) {
      throw new BadRequestException('Mục tiêu tuần (goal) không được để trống');
    }

    // Verify project belongs to Leader
    const project = await this.prisma.project.findFirst({
      where: { id: dto.project_id, owner_id: userId, deleted_at: null },
    });
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại hoặc bạn không có quyền truy cập');
    }

    // Check unique (project_id, year, week_number)
    const existing = await this.prisma.weeklyPlan.findUnique({
      where: {
        project_id_year_week_number: {
          project_id: dto.project_id,
          year: dto.year,
          week_number: dto.week_number,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Kế hoạch cho dự án "${project.name}" trong tuần ${dto.week_number}/${dto.year} đã tồn tại`,
      );
    }

    // Dates
    let startDate: Date;
    let endDate: Date;
    if (dto.start_date && dto.end_date) {
      startDate = new Date(dto.start_date);
      endDate = new Date(dto.end_date);
    } else {
      const calculated = getWeekDateRange(dto.year, dto.week_number);
      startDate = calculated.startDate;
      endDate = calculated.endDate;
    }

    const created = await this.prisma.weeklyPlan.create({
      data: {
        project_id: dto.project_id,
        year: dto.year,
        week_number: dto.week_number,
        goal: goalText,
        status: (dto.status as WeeklyPlanStatus) ?? WeeklyPlanStatus.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // If task_ids provided, link them
    if (dto.task_ids && dto.task_ids.length > 0) {
      await this.assignTasksInternal(userId, created.id, dto.task_ids);
    }

    return this.findOne(userId, created.id);
  }

  async findAll(userId: string, query: QueryWeeklyPlanDto): Promise<WeeklyPlanDto[]> {
    const where: Prisma.WeeklyPlanWhereInput = {
      owner_id: userId,
    };

    if (query.projectId) {
      where.project_id = query.projectId;
    }
    if (query.year) {
      where.year = query.year;
    }
    if (query.week) {
      where.week_number = query.week;
    }
    if (query.status) {
      where.status = query.status;
    }

    const plans = await this.prisma.weeklyPlan.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        weekly_plan_tasks: {
          include: {
            task: {
              include: {
                assignee: true,
              },
            },
          },
        },
        weekly_review: true,
      },
      orderBy: [{ year: 'desc' }, { week_number: 'desc' }, { created_at: 'desc' }],
    });

    return plans.map((plan) => this.mapToDto(plan));
  }

  async findOne(userId: string, id: string): Promise<WeeklyPlanDto> {
    const plan = await this.prisma.weeklyPlan.findFirst({
      where: { id, owner_id: userId },
      include: {
        project: { select: { id: true, name: true, code: true } },
        weekly_plan_tasks: {
          include: {
            task: {
              include: {
                assignee: true,
              },
            },
          },
        },
        weekly_review: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Không tìm thấy kế hoạch tuần');
    }

    return this.mapToDto(plan);
  }

  async update(userId: string, id: string, dto: UpdateWeeklyPlanDto): Promise<WeeklyPlanDto> {
    await this.findOne(userId, id);

    const updateData: Prisma.WeeklyPlanUpdateInput = {};
    const goalText = (dto.goal ?? dto.goals)?.trim();
    if (goalText !== undefined) {
      if (!goalText) {
        throw new BadRequestException('Mục tiêu tuần không được để trống');
      }
      updateData.goal = goalText;
    }
    if (dto.status) {
      updateData.status = dto.status;
    }
    if (dto.start_date) {
      updateData.start_date = new Date(dto.start_date);
    }
    if (dto.end_date) {
      updateData.end_date = new Date(dto.end_date);
    }

    await this.prisma.weeklyPlan.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(userId, id);
  }

  async assignTasks(
    userId: string,
    planId: string,
    dto: AssignWeeklyTasksDto,
  ): Promise<WeeklyPlanDto> {
    await this.findOne(userId, planId);
    await this.assignTasksInternal(userId, planId, dto.task_ids);
    return this.findOne(userId, planId);
  }

  private async assignTasksInternal(
    userId: string,
    planId: string,
    taskIds: string[],
  ): Promise<void> {
    if (!taskIds || taskIds.length === 0) return;

    // Verify tasks belong to Leader
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        owner_id: userId,
        deleted_at: null,
      },
      select: { id: true, status: true },
    });

    for (const t of tasks) {
      await this.prisma.weeklyPlanTask.upsert({
        where: {
          weekly_plan_id_task_id: {
            weekly_plan_id: planId,
            task_id: t.id,
          },
        },
        create: {
          weekly_plan_id: planId,
          task_id: t.id,
          planned_status: t.status,
          result_status: t.status,
        },
        update: {
          result_status: t.status,
        },
      });
    }
  }

  async removeTask(userId: string, planId: string, taskId: string): Promise<WeeklyPlanDto> {
    await this.findOne(userId, planId);

    await this.prisma.weeklyPlanTask.deleteMany({
      where: {
        weekly_plan_id: planId,
        task_id: taskId,
      },
    });

    return this.findOne(userId, planId);
  }

  async createOrUpdateReview(
    userId: string,
    planId: string,
    dto: CreateWeeklyReviewDto,
  ): Promise<WeeklyReviewDto> {
    const plan = await this.findOne(userId, planId);

    // Calculate actual counts if not explicitly given
    const total = plan.total_tasks;
    const completed =
      dto.completed !== undefined ? dto.completed : plan.completed_tasks;
    const planned = dto.planned !== undefined ? dto.planned : total;
    const blocked =
      dto.blocked !== undefined
        ? dto.blocked
        : (plan.tasks ?? []).filter((t) => t.task?.status === 'WAITING').length;
    const carriedOver = dto.carried_over !== undefined ? dto.carried_over : 0;
    const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    const updateReviewData: Prisma.WeeklyReviewUpdateInput = {
      summary: dto.summary,
      planned,
      completed,
      blocked,
      carried_over: carriedOver,
      completion_rate: dto.completion_rate ?? rate,
      reviewed_at: new Date(),
    };
    if (dto.achievements !== undefined) {
      updateReviewData.achievements = dto.achievements;
    }
    if (dto.challenges !== undefined) {
      updateReviewData.challenges = dto.challenges;
    }
    if (dto.improvements !== undefined) {
      updateReviewData.improvements = dto.improvements;
    }

    const review = await this.prisma.weeklyReview.upsert({
      where: { weekly_plan_id: planId },
      create: {
        weekly_plan_id: planId,
        summary: dto.summary,
        achievements: dto.achievements ?? null,
        challenges: dto.challenges ?? null,
        improvements: dto.improvements ?? null,
        planned,
        completed,
        blocked,
        carried_over: carriedOver,
        completion_rate: dto.completion_rate ?? rate,
        reviewed_at: new Date(),
      },
      update: updateReviewData,
    });

    return {
      id: review.id,
      weekly_plan_id: review.weekly_plan_id,
      planned: review.planned,
      completed: review.completed,
      blocked: review.blocked,
      carried_over: review.carried_over,
      completion_rate: Number(review.completion_rate),
      summary: review.summary,
      achievements: review.achievements,
      challenges: review.challenges,
      improvements: review.improvements,
      reviewed_at: review.reviewed_at.toISOString(),
      created_at: review.created_at.toISOString(),
      updated_at: review.updated_at.toISOString(),
    };
  }

  async getReview(userId: string, planId: string): Promise<WeeklyReviewDto> {
    await this.findOne(userId, planId);

    const review = await this.prisma.weeklyReview.findUnique({
      where: { weekly_plan_id: planId },
    });

    if (!review) {
      throw new NotFoundException('Kế hoạch tuần này chưa có bản đánh giá (Weekly Review)');
    }

    return {
      id: review.id,
      weekly_plan_id: review.weekly_plan_id,
      planned: review.planned,
      completed: review.completed,
      blocked: review.blocked,
      carried_over: review.carried_over,
      completion_rate: Number(review.completion_rate),
      summary: review.summary,
      achievements: review.achievements,
      challenges: review.challenges,
      improvements: review.improvements,
      reviewed_at: review.reviewed_at.toISOString(),
      created_at: review.created_at.toISOString(),
      updated_at: review.updated_at.toISOString(),
    };
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOne(userId, id);
    await this.prisma.weeklyPlan.delete({
      where: { id },
    });
    return { message: 'Đã xóa kế hoạch tuần thành công' };
  }

  private mapToDto(plan: WeeklyPlanWithRelations): WeeklyPlanDto {
    const rawTasks = plan.weekly_plan_tasks ?? [];
    const tasks = rawTasks.map((wpt) => ({
      id: wpt.id,
      weekly_plan_id: wpt.weekly_plan_id,
      task_id: wpt.task_id,
      planned_status: wpt.planned_status,
      result_status: wpt.result_status,
      carried_over: wpt.carried_over,
      task: wpt.task
        ? {
            id: wpt.task.id,
            title: wpt.task.title,
            description: wpt.task.description,
            priority: wpt.task.priority,
            status: wpt.task.status,
            due_date: wpt.task.due_date ? wpt.task.due_date.toISOString() : null,
            due_time: wpt.task.due_time,
            weight: wpt.task.weight,
            completed_at: wpt.task.completed_at ? wpt.task.completed_at.toISOString() : null,
            project_id: wpt.task.project_id,
            member_id: wpt.task.member_id,
            owner_id: wpt.task.owner_id,
            assignee: wpt.task.assignee
              ? {
                  id: wpt.task.assignee.id,
                  name: wpt.task.assignee.name,
                  nickname: wpt.task.assignee.nickname,
                  role: wpt.task.assignee.role,
                  level: wpt.task.assignee.level,
                  email: wpt.task.assignee.email,
                  phone: wpt.task.assignee.phone,
                  active: wpt.task.assignee.active,
                  notes: wpt.task.assignee.notes,
                  created_at: wpt.task.assignee.created_at.toISOString(),
                  updated_at: wpt.task.assignee.updated_at.toISOString(),
                }
              : undefined,
            created_at: wpt.task.created_at.toISOString(),
            updated_at: wpt.task.updated_at.toISOString(),
          }
        : undefined,
    }));

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.task?.status === 'DONE').length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let reviewDto: WeeklyReviewDto | null = null;
    if (plan.weekly_review) {
      reviewDto = {
        id: plan.weekly_review.id,
        weekly_plan_id: plan.weekly_review.weekly_plan_id,
        planned: plan.weekly_review.planned,
        completed: plan.weekly_review.completed,
        blocked: plan.weekly_review.blocked,
        carried_over: plan.weekly_review.carried_over,
        completion_rate: Number(plan.weekly_review.completion_rate),
        summary: plan.weekly_review.summary,
        achievements: plan.weekly_review.achievements,
        challenges: plan.weekly_review.challenges,
        improvements: plan.weekly_review.improvements,
        reviewed_at: plan.weekly_review.reviewed_at.toISOString(),
        created_at: plan.weekly_review.created_at.toISOString(),
        updated_at: plan.weekly_review.updated_at.toISOString(),
      };
    }

    return {
      id: plan.id,
      project_id: plan.project_id,
      project_name: plan.project?.name,
      project_code: plan.project?.code,
      week_number: plan.week_number,
      year: plan.year,
      goal: plan.goal,
      goals: plan.goal,
      status: plan.status as WeeklyPlanStatus,
      start_date: plan.start_date.toISOString(),
      end_date: plan.end_date.toISOString(),
      owner_id: plan.owner_id,
      created_at: plan.created_at.toISOString(),
      updated_at: plan.updated_at.toISOString(),
      tasks,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: completionRate,
      review: reviewDto,
    };
  }
}
