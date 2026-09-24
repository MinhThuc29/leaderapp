import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Severity, Probability, RiskStatus } from '@prisma/client';
import {
  RiskDto,
  RiskMatrixDto,
  RiskMatrixCellDto,
} from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RiskFilterDto } from './dto/risk-filter.dto';

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class RisksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRiskDto): Promise<RiskDto> {
    // Check project exists & belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: dto.project_id, owner_id: userId, deleted_at: null },
    });
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại hoặc không thuộc quyền quản lý của bạn');
    }

    const severity = dto.severity ?? dto.impact ?? Severity.MEDIUM;
    const probability = dto.probability ?? Probability.MEDIUM;
    const status = dto.status ?? RiskStatus.OPEN;
    const mitigation = dto.mitigation ?? dto.mitigation_plan ?? '';
    const description = dto.description ?? '';
    const dueDate = dto.due_date ? new Date(dto.due_date) : null;

    const risk = await this.prisma.risk.create({
      data: {
        project_id: dto.project_id,
        title: dto.title.trim(),
        description: description.trim(),
        severity,
        probability,
        status,
        owner_member_id: dto.owner_member_id || null,
        mitigation: mitigation.trim(),
        due_date: dueDate,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner_member: true,
      },
    });

    return this.mapToDto(risk);
  }

  async findAll(userId: string, filter?: RiskFilterDto): Promise<RiskDto[]> {
    const where: Prisma.RiskWhereInput = {
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
    if (filter?.probability) {
      where.probability = filter.probability;
    }
    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { mitigation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const risks = await this.prisma.risk.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { severity: 'desc' },
        { probability: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner_member: true,
      },
    });

    return risks.map((r) => this.mapToDto(r));
  }

  async findOne(userId: string, id: string): Promise<RiskDto> {
    const risk = await this.prisma.risk.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner_member: true,
      },
    });

    if (!risk) {
      throw new NotFoundException('Không tìm thấy rủi ro');
    }

    return this.mapToDto(risk);
  }

  async update(userId: string, id: string, dto: UpdateRiskDto): Promise<RiskDto> {
    const existing = await this.prisma.risk.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy rủi ro');
    }

    const data: Prisma.RiskUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.severity !== undefined) data.severity = dto.severity;
    else if (dto.impact !== undefined) data.severity = dto.impact;

    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.owner_member_id !== undefined) {
      data.owner_member = dto.owner_member_id
        ? { connect: { id: dto.owner_member_id } }
        : { disconnect: true };
    }
    if (dto.mitigation !== undefined) data.mitigation = dto.mitigation.trim();
    else if (dto.mitigation_plan !== undefined) data.mitigation = dto.mitigation_plan.trim();

    if (dto.due_date !== undefined) {
      data.due_date = dto.due_date ? new Date(dto.due_date) : null;
    }
    if (dto.project_id !== undefined) {
      data.project = { connect: { id: dto.project_id } };
    }

    const updated = await this.prisma.risk.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner_member: true,
      },
    });

    return this.mapToDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.risk.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy rủi ro');
    }

    await this.prisma.risk.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { success: true, id };
  }

  async getMatrix(userId: string, projectId?: string): Promise<RiskMatrixDto> {
    const where: Prisma.RiskWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };
    if (projectId) {
      where.project_id = projectId;
    }

    const allRisks = await this.prisma.risk.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner_member: true,
      },
    });

    const probabilities: Probability[] = [Probability.HIGH, Probability.MEDIUM, Probability.LOW];
    const severities: Severity[] = [
      Severity.CRITICAL,
      Severity.HIGH,
      Severity.MEDIUM,
      Severity.LOW,
    ];

    const cells: RiskMatrixCellDto[] = [];
    let highExposureCount = 0;

    for (const prob of probabilities) {
      for (const sev of severities) {
        const matchingRisks = allRisks
          .filter((r) => r.probability === prob && r.severity === sev)
          .map((r) => this.mapToDto(r));

        let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (sev === Severity.CRITICAL || (sev === Severity.HIGH && prob !== Probability.LOW)) {
          level = 'HIGH';
          if (matchingRisks.some((r) => r.status !== RiskStatus.CLOSED && r.status !== RiskStatus.MITIGATED)) {
            highExposureCount += matchingRisks.filter(
              (r) => r.status !== RiskStatus.CLOSED && r.status !== RiskStatus.MITIGATED,
            ).length;
          }
        } else if (
          sev === Severity.HIGH ||
          (sev === Severity.MEDIUM && prob !== Probability.LOW) ||
          (sev === Severity.LOW && prob === Probability.HIGH)
        ) {
          level = 'MEDIUM';
        }

        cells.push({
          probability: prob,
          severity: sev,
          level,
          count: matchingRisks.length,
          risks: matchingRisks,
        });
      }
    }

    const openRisks = allRisks.filter(
      (r) => r.status === RiskStatus.OPEN || r.status === RiskStatus.MONITORING,
    ).length;
    const mitigatedRisks = allRisks.filter(
      (r) => r.status === RiskStatus.MITIGATED || r.status === RiskStatus.CLOSED,
    ).length;

    return {
      total_risks: allRisks.length,
      open_risks: openRisks,
      mitigated_risks: mitigatedRisks,
      high_exposure_count: highExposureCount,
      cells,
    };
  }

  private mapToDto(risk: Prisma.RiskGetPayload<{
    include: {
      project: { select: { id: true; name: true; code: true } };
      owner_member: true;
    };
  }>): RiskDto {
    return {
      id: risk.id,
      project_id: risk.project_id,
      project_name: risk.project?.name,
      project_code: risk.project?.code,
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      probability: risk.probability,
      status: risk.status,
      owner_member_id: risk.owner_member_id,
      owner_member_name: risk.owner_member?.name,
      mitigation: risk.mitigation,
      due_date: formatDate(risk.due_date),
      owner_id: risk.owner_id,
      created_at: risk.created_at.toISOString(),
      updated_at: risk.updated_at.toISOString(),
      project: risk.project ? {
        id: risk.project.id,
        name: risk.project.name,
        code: risk.project.code,
      } : undefined,
      owner_member: risk.owner_member ? {
        id: risk.owner_member.id,
        name: risk.owner_member.name,
        nickname: risk.owner_member.nickname,
        role: risk.owner_member.role,
        level: risk.owner_member.level,
        email: risk.owner_member.email,
        phone: risk.owner_member.phone,
        active: risk.owner_member.active,
        notes: risk.owner_member.notes,
        created_at: risk.owner_member.created_at.toISOString(),
        updated_at: risk.owner_member.updated_at.toISOString(),
      } : undefined,
    };
  }
}
