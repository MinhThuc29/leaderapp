import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LessonLearnedDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonLearnedDto } from './dto/create-lesson-learned.dto';
import { UpdateLessonLearnedDto } from './dto/update-lesson-learned.dto';
import { QueryLessonLearnedDto } from './dto/query-lesson-learned.dto';

@Injectable()
export class LessonsLearnedService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLessonLearnedDto): Promise<LessonLearnedDto> {
    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
      }
    }

    const situation = (dto.situation ?? dto.context ?? '').trim();

    const lesson = await this.prisma.lessonLearned.create({
      data: {
        title: dto.title.trim(),
        situation: situation || 'Chung',
        problem: dto.problem.trim(),
        root_cause: dto.root_cause.trim(),
        lesson: dto.lesson.trim(),
        future_action: dto.future_action.trim(),
        project_id: dto.project_id ?? null,
        incident_id: dto.incident_id ?? null,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        lesson_tags: { include: { tag: true } },
      },
    });

    if (dto.tags && dto.tags.length > 0) {
      await this.syncTags(lesson.id, dto.tags);
      return this.findOne(userId, lesson.id);
    }

    return this.mapToDto(lesson);
  }

  async findAll(userId: string, query: QueryLessonLearnedDto): Promise<LessonLearnedDto[]> {
    const where: Prisma.LessonLearnedWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.tag?.trim()) {
      where.lesson_tags = {
        some: {
          tag: {
            name: { equals: query.tag.trim().toLowerCase(), mode: 'insensitive' },
          },
        },
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { situation: { contains: search, mode: 'insensitive' } },
        { problem: { contains: search, mode: 'insensitive' } },
        { root_cause: { contains: search, mode: 'insensitive' } },
        { lesson: { contains: search, mode: 'insensitive' } },
        { future_action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const lessons = await this.prisma.lessonLearned.findMany({
      where,
      orderBy: [{ created_at: 'desc' }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        lesson_tags: { include: { tag: true } },
      },
    });

    return lessons.map((l) => this.mapToDto(l));
  }

  async findOne(userId: string, id: string): Promise<LessonLearnedDto> {
    const lesson = await this.prisma.lessonLearned.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        lesson_tags: { include: { tag: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học kinh nghiệm với ID: ${id}`);
    }

    return this.mapToDto(lesson);
  }

  async update(userId: string, id: string, dto: UpdateLessonLearnedDto): Promise<LessonLearnedDto> {
    await this.findOne(userId, id);

    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
      }
    }

    const data: Prisma.LessonLearnedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    const situation = dto.situation ?? dto.context;
    if (situation !== undefined) data.situation = situation.trim();
    if (dto.problem !== undefined) data.problem = dto.problem.trim();
    if (dto.root_cause !== undefined) data.root_cause = dto.root_cause.trim();
    if (dto.lesson !== undefined) data.lesson = dto.lesson.trim();
    if (dto.future_action !== undefined) data.future_action = dto.future_action.trim();
    if (dto.project_id !== undefined) {
      data.project = dto.project_id ? { connect: { id: dto.project_id } } : { disconnect: true };
    }
    if (dto.incident_id !== undefined) {
      data.incident = dto.incident_id ? { connect: { id: dto.incident_id } } : { disconnect: true };
    }

    await this.prisma.lessonLearned.update({
      where: { id },
      data,
    });

    if (dto.tags !== undefined) {
      await this.syncTags(id, dto.tags);
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOne(userId, id);

    await this.prisma.lessonLearned.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa bài học kinh nghiệm thành công' };
  }

  private async syncTags(lessonId: string, tagNames: string[]): Promise<void> {
    await this.prisma.lessonTag.deleteMany({ where: { lesson_id: lessonId } });

    const cleanNames = Array.from(
      new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean))
    );

    for (const name of cleanNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.lessonTag.create({
        data: { lesson_id: lessonId, tag_id: tag.id },
      });
    }
  }

  private mapToDto(lesson: {
    id: string;
    title: string;
    situation: string;
    problem: string;
    root_cause: string;
    lesson: string;
    future_action: string;
    project_id: string | null;
    incident_id: string | null;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
    project?: { id: string; name: string; code: string } | null;
    lesson_tags?: Array<{ tag: { name: string } }> | null;
  }): LessonLearnedDto {
    const tags = (lesson.lesson_tags ?? []).map((lt) => lt.tag.name);

    return {
      id: lesson.id,
      title: lesson.title,
      situation: lesson.situation,
      problem: lesson.problem,
      root_cause: lesson.root_cause,
      lesson: lesson.lesson,
      future_action: lesson.future_action,
      project_id: lesson.project_id,
      incident_id: lesson.incident_id,
      owner_id: lesson.owner_id,
      created_at: lesson.created_at.toISOString(),
      updated_at: lesson.updated_at.toISOString(),
      tags,
      project: lesson.project
        ? { id: lesson.project.id, name: lesson.project.name, code: lesson.project.code }
        : undefined,
    };
  }
}
