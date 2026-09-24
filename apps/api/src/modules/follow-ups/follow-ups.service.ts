import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowUpStatus, Prisma } from '@prisma/client';
import { FollowUpDto, MemberDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { QueryFollowUpDto } from './dto/query-follow-up.dto';

@Injectable()
export class FollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFollowUpDto): Promise<FollowUpDto> {
    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
      }
    }

    if (dto.member_id) {
      const member = await this.prisma.member.findFirst({
        where: { id: dto.member_id, deleted_at: null },
      });
      if (!member) {
        throw new NotFoundException(`Không tìm thấy thành viên với ID: ${dto.member_id}`);
      }
    }

    const followUp = await this.prisma.followUp.create({
      data: {
        title: dto.title.trim(),
        waiting_for: dto.waiting_for.trim(),
        follow_up_date: new Date(dto.follow_up_date),
        status: dto.status ?? FollowUpStatus.WAITING,
        project_id: dto.project_id ?? null,
        member_id: dto.member_id ?? null,
        note: dto.note?.trim() || null,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    return this.mapToDto(followUp);
  }

  async findAll(userId: string, query: QueryFollowUpDto): Promise<FollowUpDto[]> {
    const where: Prisma.FollowUpWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.member_id) {
      where.member_id = query.member_id;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { waiting_for: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    const followUps = await this.prisma.followUp.findMany({
      where,
      orderBy: [{ follow_up_date: 'asc' }, { created_at: 'desc' }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    return followUps.map((f) => this.mapToDto(f));
  }

  async findOne(userId: string, id: string): Promise<FollowUpDto> {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    if (!followUp) {
      throw new NotFoundException(`Không tìm thấy follow-up với ID: ${id}`);
    }

    return this.mapToDto(followUp);
  }

  async update(userId: string, id: string, dto: UpdateFollowUpDto): Promise<FollowUpDto> {
    await this.findOne(userId, id);

    if (dto.project_id) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.project_id, deleted_at: null },
      });
      if (!project) {
        throw new NotFoundException(`Không tìm thấy dự án với ID: ${dto.project_id}`);
      }
    }

    if (dto.member_id) {
      const member = await this.prisma.member.findFirst({
        where: { id: dto.member_id, deleted_at: null },
      });
      if (!member) {
        throw new NotFoundException(`Không tìm thấy thành viên với ID: ${dto.member_id}`);
      }
    }

    const data: Prisma.FollowUpUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.waiting_for !== undefined) data.waiting_for = dto.waiting_for.trim();
    if (dto.follow_up_date !== undefined) data.follow_up_date = new Date(dto.follow_up_date);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.project_id !== undefined) {
      data.project = dto.project_id ? { connect: { id: dto.project_id } } : { disconnect: true };
    }
    if (dto.member_id !== undefined) {
      data.member = dto.member_id ? { connect: { id: dto.member_id } } : { disconnect: true };
    }
    if (dto.note !== undefined) data.note = dto.note ? dto.note.trim() : null;

    const updated = await this.prisma.followUp.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    return this.mapToDto(updated);
  }

  async updateStatus(userId: string, id: string, status: FollowUpStatus): Promise<FollowUpDto> {
    await this.findOne(userId, id);

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: { status },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    return this.mapToDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOne(userId, id);

    await this.prisma.followUp.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa follow-up thành công' };
  }

  private toDateString(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0] ?? '';
  }

  private mapToDto(followUp: {
    id: string;
    title: string;
    waiting_for: string;
    follow_up_date: Date;
    status: FollowUpStatus;
    project_id: string | null;
    member_id: string | null;
    note: string | null;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
    project?: { id: string; name: string; code: string } | null;
    member?: {
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
  }): FollowUpDto {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue =
      followUp.status === FollowUpStatus.WAITING &&
      new Date(followUp.follow_up_date) < today;

    let memberDto: MemberDto | undefined = undefined;
    if (followUp.member) {
      memberDto = {
        id: followUp.member.id,
        name: followUp.member.name,
        nickname: followUp.member.nickname,
        role: followUp.member.role,
        level: followUp.member.level,
        email: followUp.member.email,
        phone: followUp.member.phone,
        active: followUp.member.active,
        notes: followUp.member.notes,
        created_at: followUp.member.created_at.toISOString(),
        updated_at: followUp.member.updated_at.toISOString(),
      };
    }

    return {
      id: followUp.id,
      title: followUp.title,
      waiting_for: followUp.waiting_for,
      follow_up_date: this.toDateString(followUp.follow_up_date),
      status: followUp.status,
      project_id: followUp.project_id,
      member_id: followUp.member_id,
      note: followUp.note,
      owner_id: followUp.owner_id,
      created_at: followUp.created_at.toISOString(),
      updated_at: followUp.updated_at.toISOString(),
      is_overdue: isOverdue,
      project: followUp.project ? { id: followUp.project.id, name: followUp.project.name, code: followUp.project.code } : undefined,
      member: memberDto,
    };
  }
}
