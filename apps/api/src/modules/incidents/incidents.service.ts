import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Severity, IncidentStatus } from '@prisma/client';
import { IncidentDto, LessonLearnedDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ConvertIncidentToLessonDto } from './dto/convert-to-lesson.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateIncidentDto): Promise<IncidentDto> {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.project_id, owner_id: userId, deleted_at: null },
    });
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại hoặc không thuộc quyền quản lý của bạn');
    }

    const severity = dto.severity ?? Severity.HIGH;
    const status = dto.status ?? IncidentStatus.OPEN;
    const solution = dto.solution ?? dto.action_taken ?? null;
    const detectedAt = dto.detected_at ? new Date(dto.detected_at) : new Date();
    const resolvedAt = dto.resolved_at ? new Date(dto.resolved_at) : null;

    const incident = await this.prisma.incident.create({
      data: {
        project_id: dto.project_id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        severity,
        status,
        detected_at: detectedAt,
        resolved_at: resolvedAt,
        root_cause: dto.root_cause ? dto.root_cause.trim() : null,
        solution: solution ? solution.trim() : null,
        prevention: dto.prevention ? dto.prevention.trim() : null,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { lessons_learned: true } },
      },
    });

    return this.mapToDto(incident);
  }

  async findAll(userId: string, filter?: IncidentFilterDto): Promise<IncidentDto[]> {
    const where: Prisma.IncidentWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    if (filter?.projectId) {
      where.project_id = filter.projectId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.severity) {
      where.severity = filter.severity;
    }
    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { root_cause: { contains: search, mode: 'insensitive' } },
        { solution: { contains: search, mode: 'insensitive' } },
        { prevention: { contains: search, mode: 'insensitive' } },
      ];
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { detected_at: 'desc' },
      ],
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { lessons_learned: true } },
      },
    });

    return incidents.map((i) => this.mapToDto(i));
  }

  async findOne(userId: string, id: string): Promise<IncidentDto> {
    const incident = await this.prisma.incident.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { lessons_learned: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException('Không tìm thấy sự cố');
    }

    return this.mapToDto(incident);
  }

  async update(userId: string, id: string, dto: UpdateIncidentDto): Promise<IncidentDto> {
    const existing = await this.prisma.incident.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy sự cố');
    }

    const data: Prisma.IncidentUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === IncidentStatus.RESOLVED && !existing.resolved_at && !dto.resolved_at) {
        data.resolved_at = new Date();
      }
    }
    if (dto.detected_at !== undefined) {
      data.detected_at = dto.detected_at ? new Date(dto.detected_at) : new Date();
    }
    if (dto.resolved_at !== undefined) {
      data.resolved_at = dto.resolved_at ? new Date(dto.resolved_at) : null;
    }
    if (dto.root_cause !== undefined) {
      data.root_cause = dto.root_cause ? dto.root_cause.trim() : null;
    }
    if (dto.solution !== undefined) {
      data.solution = dto.solution ? dto.solution.trim() : null;
    } else if (dto.action_taken !== undefined) {
      data.solution = dto.action_taken ? dto.action_taken.trim() : null;
    }
    if (dto.prevention !== undefined) {
      data.prevention = dto.prevention ? dto.prevention.trim() : null;
    }
    if (dto.project_id !== undefined) {
      data.project = { connect: { id: dto.project_id } };
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { lessons_learned: true } },
      },
    });

    return this.mapToDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.incident.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy sự cố');
    }

    await this.prisma.incident.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { success: true, id };
  }

  async convertToLesson(
    userId: string,
    id: string,
    dto: ConvertIncidentToLessonDto,
  ): Promise<LessonLearnedDto> {
    const incident = await this.prisma.incident.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: { project: true },
    });
    if (!incident) {
      throw new NotFoundException('Không tìm thấy sự cố');
    }

    const title = dto.title?.trim() || `Bài học từ sự cố: ${incident.title}`;
    const situation = dto.situation?.trim() || `Sự cố trên dự án [${incident.project.code}] ${incident.project.name}`;
    const problem = dto.problem?.trim() || incident.description;
    const rootCause = dto.root_cause?.trim() || incident.root_cause || 'Cần điều tra thêm nguyên nhân gốc rễ';
    const lesson = dto.lesson.trim();
    const futureAction = dto.future_action.trim();

    // Create lesson learned linked to this incident
    const lessonLearned = await this.prisma.lessonLearned.create({
      data: {
        title,
        situation,
        problem,
        root_cause: rootCause,
        lesson,
        future_action: futureAction,
        project_id: incident.project_id,
        incident_id: incident.id,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // Handle tags if provided
    const tags = dto.tags && Array.isArray(dto.tags) ? dto.tags : ['incident'];
    for (const tagName of tags) {
      const cleanTag = tagName.trim().toLowerCase();
      if (!cleanTag) continue;

      let tagRecord = await this.prisma.tag.findUnique({
        where: { name: cleanTag },
      });
      if (!tagRecord) {
        tagRecord = await this.prisma.tag.create({
          data: { name: cleanTag },
        });
      }

      await this.prisma.lessonTag.upsert({
        where: {
          lesson_id_tag_id: {
            lesson_id: lessonLearned.id,
            tag_id: tagRecord.id,
          },
        },
        create: {
          lesson_id: lessonLearned.id,
          tag_id: tagRecord.id,
        },
        update: {},
      });
    }

    return {
      id: lessonLearned.id,
      title: lessonLearned.title,
      situation: lessonLearned.situation,
      problem: lessonLearned.problem,
      root_cause: lessonLearned.root_cause,
      lesson: lessonLearned.lesson,
      future_action: lessonLearned.future_action,
      project_id: lessonLearned.project_id,
      incident_id: lessonLearned.incident_id,
      owner_id: lessonLearned.owner_id,
      created_at: lessonLearned.created_at.toISOString(),
      updated_at: lessonLearned.updated_at.toISOString(),
      tags,
      project: lessonLearned.project ? {
        id: lessonLearned.project.id,
        name: lessonLearned.project.name,
        code: lessonLearned.project.code,
      } : undefined,
    };
  }

  private mapToDto(incident: Prisma.IncidentGetPayload<{
    include: {
      project: { select: { id: true; name: true; code: true } };
      _count: { select: { lessons_learned: true } };
    };
  }>): IncidentDto {
    return {
      id: incident.id,
      project_id: incident.project_id,
      project_name: incident.project?.name,
      project_code: incident.project?.code,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      detected_at: incident.detected_at.toISOString(),
      resolved_at: incident.resolved_at ? incident.resolved_at.toISOString() : null,
      root_cause: incident.root_cause,
      solution: incident.solution,
      prevention: incident.prevention,
      owner_id: incident.owner_id,
      created_at: incident.created_at.toISOString(),
      updated_at: incident.updated_at.toISOString(),
      project: incident.project ? {
        id: incident.project.id,
        name: incident.project.name,
        code: incident.project.code,
      } : undefined,
      lessons_count: incident._count?.lessons_learned ?? 0,
    };
  }
}
