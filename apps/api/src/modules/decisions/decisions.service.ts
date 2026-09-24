import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, DecisionStatus } from '@prisma/client';
import { DecisionDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { DecisionFilterDto } from './dto/decision-filter.dto';

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class DecisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDecisionDto): Promise<DecisionDto> {
    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, owner_id: userId, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException('Dự án liên kết không tồn tại hoặc không thuộc quyền quản lý của bạn');
      }
    }

    const decisionText = dto.decision ?? dto.chosen_option ?? '';
    const reasonText = dto.reason ?? dto.rationale ?? '';
    const expectedResultText = dto.expected_result ?? dto.expected_outcome ?? '';
    const decisionDate = dto.decision_date ? new Date(dto.decision_date) : new Date();
    const reviewDate = dto.review_date ? new Date(dto.review_date) : null;
    const status = dto.status ?? DecisionStatus.DECIDED;

    const decision = await this.prisma.decision.create({
      data: {
        title: dto.title.trim(),
        project_id: dto.project_id || null,
        context: dto.context.trim(),
        options_considered: dto.options_considered.trim(),
        decision: decisionText.trim(),
        reason: reasonText.trim(),
        expected_result: expectedResultText.trim(),
        actual_result: dto.actual_result ? dto.actual_result.trim() : null,
        decision_date: decisionDate,
        review_date: reviewDate,
        status,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return this.mapToDto(decision);
  }

  async findAll(userId: string, filter?: DecisionFilterDto): Promise<DecisionDto[]> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Business Logic: Chuyển DECIDED -> REVIEW_PENDING khi tới review_date
    await this.prisma.decision.updateMany({
      where: {
        owner_id: userId,
        deleted_at: null,
        status: DecisionStatus.DECIDED,
        review_date: {
          not: null,
          lte: today,
        },
      },
      data: {
        status: DecisionStatus.REVIEW_PENDING,
      },
    });

    const where: Prisma.DecisionWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    if (filter?.projectId) {
      where.project_id = filter.projectId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { context: { contains: search, mode: 'insensitive' } },
        { options_considered: { contains: search, mode: 'insensitive' } },
        { decision: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { expected_result: { contains: search, mode: 'insensitive' } },
        { actual_result: { contains: search, mode: 'insensitive' } },
      ];
    }

    const decisions = await this.prisma.decision.findMany({
      where,
      orderBy: [
        { decision_date: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return decisions.map((d) => this.mapToDto(d));
  }

  async findOne(userId: string, id: string): Promise<DecisionDto> {
    const decision = await this.prisma.decision.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    if (!decision) {
      throw new NotFoundException('Không tìm thấy quyết định');
    }

    return this.mapToDto(decision);
  }

  async update(userId: string, id: string, dto: UpdateDecisionDto): Promise<DecisionDto> {
    const existing = await this.prisma.decision.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy quyết định');
    }

    const data: Prisma.DecisionUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.project_id !== undefined) {
      data.project = dto.project_id ? { connect: { id: dto.project_id } } : { disconnect: true };
    }
    if (dto.context !== undefined) data.context = dto.context.trim();
    if (dto.options_considered !== undefined) data.options_considered = dto.options_considered.trim();

    if (dto.decision !== undefined) data.decision = dto.decision.trim();
    else if (dto.chosen_option !== undefined) data.decision = dto.chosen_option.trim();

    if (dto.reason !== undefined) data.reason = dto.reason.trim();
    else if (dto.rationale !== undefined) data.reason = dto.rationale.trim();

    if (dto.expected_result !== undefined) data.expected_result = dto.expected_result.trim();
    else if (dto.expected_outcome !== undefined) data.expected_result = dto.expected_outcome.trim();

    if (dto.actual_result !== undefined) data.actual_result = dto.actual_result ? dto.actual_result.trim() : null;

    if (dto.decision_date !== undefined) {
      data.decision_date = dto.decision_date ? new Date(dto.decision_date) : new Date();
    }
    if (dto.review_date !== undefined) {
      data.review_date = dto.review_date ? new Date(dto.review_date) : null;
    }
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.decision.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return this.mapToDto(updated);
  }

  async recordReview(userId: string, id: string, dto: ReviewDecisionDto): Promise<DecisionDto> {
    const existing = await this.prisma.decision.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy quyết định để đánh giá');
    }

    const actualResult = dto.notes
      ? `${dto.actual_result.trim()}\n\n[Ghi chú thêm]: ${dto.notes.trim()}`
      : dto.actual_result.trim();

    const updated = await this.prisma.decision.update({
      where: { id },
      data: {
        actual_result: actualResult,
        status: DecisionStatus.REVIEWED,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return this.mapToDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.decision.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy quyết định');
    }

    await this.prisma.decision.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { success: true, id };
  }

  private mapToDto(decision: Prisma.DecisionGetPayload<{
    include: {
      project: { select: { id: true; name: true; code: true } };
    };
  }>): DecisionDto {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    const isOverdue = Boolean(
      decision.review_date &&
      decision.status !== DecisionStatus.REVIEWED &&
      new Date(decision.review_date).getTime() < now.getTime(),
    );

    return {
      id: decision.id,
      title: decision.title,
      project_id: decision.project_id,
      project_name: decision.project?.name,
      project_code: decision.project?.code,
      context: decision.context,
      options_considered: decision.options_considered,
      decision: decision.decision,
      reason: decision.reason,
      expected_result: decision.expected_result,
      actual_result: decision.actual_result,
      decision_date: formatDate(decision.decision_date) || '',
      review_date: formatDate(decision.review_date),
      status: decision.status,
      owner_id: decision.owner_id,
      created_at: decision.created_at.toISOString(),
      updated_at: decision.updated_at.toISOString(),
      project: decision.project ? {
        id: decision.project.id,
        name: decision.project.name,
        code: decision.project.code,
      } : undefined,
      is_review_overdue: isOverdue,
    };
  }
}
