import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MilestoneStatus, Prisma } from '@prisma/client';
import { MilestoneDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { QueryMilestoneDto } from './dto/query-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMilestoneDto): Promise<MilestoneDto> {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.project_id, deleted_at: null },
    });

    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        project_id: dto.project_id,
        title: dto.title.trim(),
        description: dto.description ? dto.description.trim() : null,
        status: dto.status ?? MilestoneStatus.NOT_STARTED,
        target_date: new Date(dto.target_date),
        progress: dto.progress ?? 0,
        order: dto.order ?? 0,
      },
      include: {
        tasks: {
          where: { deleted_at: null },
          select: { id: true, status: true },
        },
      },
    });

    return this.mapToDto(milestone);
  }

  async findAll(query: QueryMilestoneDto): Promise<MilestoneDto[]> {
    const where: Prisma.MilestoneWhereInput = {
      deleted_at: null,
    };

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    const milestones = await this.prisma.milestone.findMany({
      where,
      orderBy: [{ order: 'asc' }, { target_date: 'asc' }],
      include: {
        tasks: {
          where: { deleted_at: null },
          select: { id: true, status: true },
        },
      },
    });

    return milestones.map((m) => this.mapToDto(m));
  }

  async findOne(id: string): Promise<MilestoneDto> {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id, deleted_at: null },
      include: {
        tasks: {
          where: { deleted_at: null },
          select: { id: true, status: true },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc với ID: ${id}`);
    }

    return this.mapToDto(milestone);
  }

  async update(id: string, dto: UpdateMilestoneDto): Promise<MilestoneDto> {
    const existing = await this.prisma.milestone.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy cột mốc với ID: ${id}`);
    }

    const data: Prisma.MilestoneUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) {
      data.description = dto.description ? dto.description.trim() : null;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === MilestoneStatus.COMPLETED && !existing.completed_date && !dto.completed_date) {
        data.completed_date = new Date();
        data.progress = 100;
      }
    }
    if (dto.target_date !== undefined) {
      data.target_date = new Date(dto.target_date);
    }
    if (dto.completed_date !== undefined) {
      data.completed_date = dto.completed_date ? new Date(dto.completed_date) : null;
    }
    if (dto.progress !== undefined) {
      data.progress = dto.progress;
    }
    if (dto.order !== undefined) {
      data.order = dto.order;
    }

    const updated = await this.prisma.milestone.update({
      where: { id },
      data,
      include: {
        tasks: {
          where: { deleted_at: null },
          select: { id: true, status: true },
        },
      },
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.milestone.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa cột mốc thành công' };
  }

  private toDateString(date: Date | null): string | null {
    if (!date) return null;
    const parts = date.toISOString().split('T');
    return parts[0] ?? null;
  }

  private mapToDto(milestone: {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: MilestoneStatus;
    target_date: Date;
    completed_date: Date | null;
    progress: number;
    order: number;
    created_at: Date;
    updated_at: Date;
    tasks?: Array<{ id: string; status: string }>;
  }): MilestoneDto {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDateObj = new Date(milestone.target_date);
    const isOverdue =
      milestone.status !== MilestoneStatus.COMPLETED &&
      milestone.status !== MilestoneStatus.CANCELLED &&
      targetDateObj < today;

    const tasksCount = milestone.tasks?.length ?? 0;
    const tasksDoneCount = milestone.tasks?.filter((t) => t.status === 'DONE').length ?? 0;

    return {
      id: milestone.id,
      project_id: milestone.project_id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      target_date: this.toDateString(milestone.target_date) ?? milestone.target_date.toISOString(),
      completed_date: this.toDateString(milestone.completed_date),
      progress: milestone.progress,
      order: milestone.order,
      created_at: milestone.created_at.toISOString(),
      updated_at: milestone.updated_at.toISOString(),
      is_overdue: isOverdue,
      tasks_count: tasksCount,
      tasks_done_count: tasksDoneCount,
    };
  }
}
