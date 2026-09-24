import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MilestoneStatus,
  Priority,
  Prisma,
  ProgressMode,
  TaskStatus,
} from '@prisma/client';
import {
  MemberDto,
  RescheduleTomorrowResultDto,
  TaskDto,
  TaskStatusHistoryDto,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(owner_id: string, dto: CreateTaskDto): Promise<TaskDto> {
    const memberId = dto.member_id ?? dto.assignee_id ?? null;

    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
      }
    }

    if (memberId) {
      const member = await this.prisma.member.findFirst({
        where: { id: memberId, deleted_at: null },
      });
      if (!member) {
        throw new NotFoundException(`Không tìm thấy thành viên với ID: ${memberId}`);
      }
    }

    if (dto.milestone_id) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: dto.milestone_id, deleted_at: null },
      });
      if (!milestone) {
        throw new NotFoundException(`Không tìm thấy cột mốc với ID: ${dto.milestone_id}`);
      }
    }

    const status = dto.status ?? TaskStatus.TODO;
    const completedAt = status === TaskStatus.DONE ? new Date() : null;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description ? dto.description.trim() : null,
        priority: dto.priority ?? Priority.MEDIUM,
        status,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        due_time: dto.due_time ?? null,
        weight: dto.weight ?? 1,
        completed_at: completedAt,
        project_id: dto.project_id ?? null,
        member_id: memberId,
        milestone_id: dto.milestone_id ?? null,
        owner_id,
      },
      include: {
        assignee: true,
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true, status: true } },
        task_status_history: { orderBy: { changed_at: 'desc' } },
      },
    });

    // 1. Tự động ghi lịch sử khởi tạo
    await this.prisma.taskStatusHistory.create({
      data: {
        task_id: task.id,
        from_status: null,
        to_status: task.status,
        note: 'Khởi tạo công việc',
        changed_at: new Date(),
      },
    });

    // 2. Kích hoạt tính lại tiến độ dự án nếu task thuộc về dự án
    if (task.project_id) {
      await this.recalculateProjectProgress(
        task.project_id,
        task.title,
        task.status,
      );
    }

    return this.mapToDto(task);
  }

  async findAll(query: QueryTaskDto): Promise<TaskDto[]> {
    const where: Prisma.TaskWhereInput = {
      deleted_at: null,
    };

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    const memberId = query.member_id ?? query.assignee_id;
    if (memberId) {
      where.member_id = memberId;
    }

    if (query.milestone_id) {
      where.milestone_id = query.milestone_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (query.overdue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.due_date = { lt: today };
      where.status = { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ due_date: 'asc' }, { priority: 'desc' }, { created_at: 'desc' }],
      include: {
        assignee: true,
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true, status: true } },
        task_status_history: { orderBy: { changed_at: 'desc' } },
      },
    });

    return tasks.map((t) => this.mapToDto(t));
  }

  async findOne(id: string): Promise<TaskDto> {
    const task = await this.prisma.task.findFirst({
      where: { id, deleted_at: null },
      include: {
        assignee: true,
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true, status: true } },
        task_status_history: { orderBy: { changed_at: 'desc' } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Không tìm thấy công việc với ID: ${id}`);
    }

    return this.mapToDto(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskDto> {
    const existing = await this.prisma.task.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy công việc với ID: ${id}`);
    }

    const memberId = dto.member_id !== undefined ? dto.member_id : dto.assignee_id;

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) {
      data.description = dto.description ? dto.description.trim() : null;
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.due_date !== undefined) {
      data.due_date = dto.due_date ? new Date(dto.due_date) : null;
    }
    if (dto.due_time !== undefined) {
      data.due_time = dto.due_time ? dto.due_time.trim() : null;
    }
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.project_id !== undefined) {
      data.project = dto.project_id
        ? { connect: { id: dto.project_id } }
        : { disconnect: true };
    }
    if (memberId !== undefined) {
      data.assignee = memberId
        ? { connect: { id: memberId } }
        : { disconnect: true };
    }
    if (dto.milestone_id !== undefined) {
      data.milestone = dto.milestone_id
        ? { connect: { id: dto.milestone_id } }
        : { disconnect: true };
    }

    // Xử lý thay đổi status & ghi lịch sử
    const isStatusChanged = dto.status !== undefined && dto.status !== existing.status;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
        data.completed_at = new Date();
      } else if (dto.status !== TaskStatus.DONE && existing.status === TaskStatus.DONE) {
        data.completed_at = null;
      }
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: true,
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true, status: true } },
        task_status_history: { orderBy: { changed_at: 'desc' } },
      },
    });

    if (isStatusChanged && dto.status) {
      await this.prisma.taskStatusHistory.create({
        data: {
          task_id: updated.id,
          from_status: existing.status,
          to_status: dto.status,
          note: dto.status_note ?? `Cập nhật trạng thái sang ${dto.status}`,
          changed_at: new Date(),
        },
      });
    }

    // Tự động tính lại tiến độ dự án
    const targetProjectId = updated.project_id ?? existing.project_id;
    if (targetProjectId) {
      await this.recalculateProjectProgress(
        targetProjectId,
        updated.title,
        updated.status,
      );
    }

    return this.mapToDto(updated);
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto): Promise<TaskDto> {
    const updateDto: UpdateTaskDto = {
      status: dto.status,
    };
    if (dto.note !== undefined) {
      updateDto.status_note = dto.note;
    }
    return this.update(id, updateDto);
  }

  async remove(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id);

    await this.prisma.task.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    if (task.project_id) {
      await this.recalculateProjectProgress(
        task.project_id,
        task.title,
        'Đã xóa công việc',
      );
    }

    return { message: 'Đã xóa công việc thành công' };
  }

  async rescheduleTomorrow(userId: string): Promise<RescheduleTomorrowResultDto> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const today = new Date(`${todayStr}T00:00:00.000Z`);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        due_date: { lt: today },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
      select: { id: true, status: true },
    });

    const tomorrowStr = this.toDateString(tomorrow) ?? '';

    if (overdueTasks.length === 0) {
      return {
        rescheduled_count: 0,
        new_due_date: tomorrowStr,
        message: 'Không có công việc nào quá hạn cần chuyển sang ngày mai',
      };
    }

    const ids = overdueTasks.map((t) => t.id);

    await this.prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { due_date: tomorrow },
    });

    await this.prisma.taskStatusHistory.createMany({
      data: overdueTasks.map((t) => ({
        task_id: t.id,
        from_status: t.status,
        to_status: t.status,
        note: `Dời hạn sang ngày mai (${tomorrowStr})`,
        changed_at: new Date(),
      })),
    });

    return {
      rescheduled_count: overdueTasks.length,
      new_due_date: tomorrowStr,
      message: `Đã dời hạn ${overdueTasks.length} công việc quá hạn sang ngày mai`,
    };
  }

  /**
   * ĐỘNG CƠ TỰ ĐỘNG TÍNH TIẾN ĐỘ DỰ ÁN
   * Công thức: (Tổng trọng số task DONE / Tổng trọng số task khả dụng) * 100
   * Lưu snapshot vào project_progress_snapshots
   */
  async recalculateProjectProgress(
    project_id: string,
    taskTitle: string,
    actionOrStatus: string,
  ): Promise<number> {
    const project = await this.prisma.project.findFirst({
      where: { id: project_id, deleted_at: null },
    });

    if (!project) return 0;

    // Lấy toàn bộ task hợp lệ của dự án (chưa xóa và không bị CANCELLED)
    const tasks = await this.prisma.task.findMany({
      where: {
        project_id,
        deleted_at: null,
        status: { not: TaskStatus.CANCELLED },
      },
      select: { weight: true, status: true },
    });

    const totalWeight = tasks.reduce((sum, t) => sum + (t.weight > 0 ? t.weight : 1), 0);
    const doneWeight = tasks
      .filter((t) => t.status === TaskStatus.DONE)
      .reduce((sum, t) => sum + (t.weight > 0 ? t.weight : 1), 0);

    const calculatedProgress =
      totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;

    // Cập nhật tiến độ dự án
    await this.prisma.project.update({
      where: { id: project_id },
      data: { manual_progress: calculatedProgress },
    });

    // Lưu snapshot lịch sử tiến độ
    await this.prisma.projectProgressSnapshot.create({
      data: {
        project_id,
        progress: calculatedProgress,
        mode: ProgressMode.AUTO,
        health_status: project.health_status,
        note: `Tự động tính từ công việc: "${taskTitle}" (${actionOrStatus})`,
        captured_at: new Date(),
      },
    });

    return calculatedProgress;
  }

  private toDateString(date: Date | null): string | null {
    if (!date) return null;
    const parts = date.toISOString().split('T');
    return parts[0] ?? null;
  }

  private mapToDto(task: {
    id: string;
    title: string;
    description: string | null;
    priority: Priority;
    status: TaskStatus;
    due_date: Date | null;
    due_time: string | null;
    weight: number;
    completed_at: Date | null;
    project_id: string | null;
    member_id: string | null;
    milestone_id: string | null;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
    assignee?: {
      id: string;
      name: string;
      nickname: string | null;
      role: string;
      level: string | null;
      email: string | null;
      phone: string | null;
      active: boolean;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    } | null;
    project?: { id: string; name: string; code: string } | null;
    milestone?: { id: string; title: string; status: MilestoneStatus } | null;
    task_status_history?: Array<{
      id: string;
      task_id: string;
      from_status: TaskStatus | null;
      to_status: TaskStatus;
      note: string | null;
      changed_at: Date;
    }>;
  }): TaskDto {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const isOverdue =
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED &&
      task.due_date !== null &&
      new Date(task.due_date) < today;

    const history: TaskStatusHistoryDto[] = (task.task_status_history ?? []).map((h) => ({
      id: h.id,
      task_id: h.task_id,
      from_status: h.from_status,
      to_status: h.to_status,
      note: h.note,
      changed_at: h.changed_at.toISOString(),
    }));

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
      project: task.project ? { id: task.project.id, name: task.project.name, code: task.project.code } : undefined,
      milestone: task.milestone ? { id: task.milestone.id, title: task.milestone.title, status: task.milestone.status } : undefined,
      task_status_history: history,
    };
  }
}
