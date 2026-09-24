import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LearningStatus, Priority, Prisma } from '@prisma/client';
import { LearningItemDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLearningItemDto } from './dto/create-learning-item.dto';
import { UpdateLearningItemDto } from './dto/update-learning-item.dto';
import { QueryLearningItemDto } from './dto/query-learning-item.dto';
import { UpdateLearningStatusDto } from './dto/update-learning-status.dto';

@Injectable()
export class LearningItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseStatus(statusStr?: string): LearningStatus {
    if (!statusStr) return LearningStatus.BACKLOG;
    const upper = statusStr.trim().toUpperCase();
    if (upper === 'TO_LEARN' || upper === 'BACKLOG') return LearningStatus.BACKLOG;
    if (upper === 'IN_PROGRESS' || upper === 'LEARNING') return LearningStatus.LEARNING;
    if (upper === 'PAUSED') return LearningStatus.PAUSED;
    if (upper === 'COMPLETED') return LearningStatus.COMPLETED;
    return LearningStatus.BACKLOG;
  }

  async create(userId: string, dto: CreateLearningItemDto): Promise<LearningItemDto> {
    const title = (dto.title ?? dto.topic ?? '').trim();
    if (!title) {
      throw new BadRequestException('Tiêu đề chủ đề học tập không được để trống');
    }

    const resourceUrl = (dto.resource_url ?? dto.source_url ?? '').trim() || null;
    const status = this.parseStatus(dto.status);

    const item = await this.prisma.learningItem.create({
      data: {
        title,
        category: dto.category?.trim() || null,
        description: dto.description?.trim() || null,
        priority: dto.priority ?? Priority.MEDIUM,
        status,
        target_date: dto.target_date ? new Date(`${dto.target_date}T00:00:00.000Z`) : null,
        resource_url: resourceUrl,
        notes: dto.notes?.trim() || null,
        owner_id: userId,
      },
    });

    return this.mapToDto(item);
  }

  async findAll(userId: string, query: QueryLearningItemDto): Promise<LearningItemDto[]> {
    const where: Prisma.LearningItemWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    if (query.status?.trim()) {
      where.status = this.parseStatus(query.status);
    }

    if (query.category?.trim()) {
      where.category = { equals: query.category.trim(), mode: 'insensitive' };
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.learningItem.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return items.map((item) => this.mapToDto(item));
  }

  async findOne(userId: string, id: string): Promise<LearningItemDto> {
    const item = await this.prisma.learningItem.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy chủ đề học tập với ID: ${id}`);
    }

    return this.mapToDto(item);
  }

  async update(userId: string, id: string, dto: UpdateLearningItemDto): Promise<LearningItemDto> {
    await this.findOne(userId, id);

    const data: Prisma.LearningItemUpdateInput = {};
    const title = dto.title ?? dto.topic;
    if (title !== undefined) data.title = title.trim();
    if (dto.category !== undefined) data.category = dto.category ? dto.category.trim() : null;
    if (dto.description !== undefined) data.description = dto.description ? dto.description.trim() : null;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) data.status = this.parseStatus(dto.status);
    if (dto.target_date !== undefined) {
      data.target_date = dto.target_date ? new Date(`${dto.target_date}T00:00:00.000Z`) : null;
    }
    const resourceUrl = dto.resource_url ?? dto.source_url;
    if (resourceUrl !== undefined) {
      data.resource_url = resourceUrl ? resourceUrl.trim() : null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes ? dto.notes.trim() : null;

    const updated = await this.prisma.learningItem.update({
      where: { id },
      data,
    });

    return this.mapToDto(updated);
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateLearningStatusDto,
  ): Promise<LearningItemDto> {
    await this.findOne(userId, id);

    const newStatus = this.parseStatus(dto.status);

    const updated = await this.prisma.learningItem.update({
      where: { id },
      data: { status: newStatus },
    });

    return this.mapToDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOne(userId, id);

    await this.prisma.learningItem.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa chủ đề học tập thành công' };
  }

  private mapToDto(item: {
    id: string;
    title: string;
    category: string | null;
    description: string | null;
    priority: Priority;
    status: LearningStatus;
    target_date: Date | null;
    resource_url: string | null;
    notes: string | null;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
  }): LearningItemDto {
    const targetDateStr = item.target_date
      ? item.target_date.toISOString().split('T')[0]
      : undefined;

    return {
      id: item.id,
      title: item.title,
      topic: item.title,
      category: item.category,
      description: item.description,
      priority: item.priority,
      status: item.status,
      target_date: targetDateStr,
      resource_url: item.resource_url,
      source_url: item.resource_url,
      notes: item.notes,
      owner_id: item.owner_id,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    };
  }
}
