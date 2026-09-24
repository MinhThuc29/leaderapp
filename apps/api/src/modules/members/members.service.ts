import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MemberDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMemberDto): Promise<MemberDto[]> {
    const where: Prisma.MemberWhereInput = {
      deleted_at: null,
    };

    if (query.active !== undefined) {
      if (query.active === 'true') {
        where.active = true;
      } else if (query.active === 'false') {
        where.active = false;
      }
    }

    if (query.q && query.q.trim() !== '') {
      const searchTerm = query.q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { nickname: { contains: searchTerm, mode: 'insensitive' } },
        { role: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const members = await this.prisma.member.findMany({
      where,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return members.map((m) => this.mapToDto(m));
  }

  async findOne(id: string): Promise<MemberDto> {
    const member = await this.prisma.member.findFirst({
      where: { id, deleted_at: null },
      include: {
        project_members: {
          where: { left_at: null },
          include: { project: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Không tìm thấy thành viên với ID: ${id}`);
    }

    return this.mapToDto(member);
  }

  async create(dto: CreateMemberDto): Promise<MemberDto> {
    const member = await this.prisma.member.create({
      data: {
        name: dto.name.trim(),
        ...(dto.nickname !== undefined && { nickname: dto.nickname.trim() }),
        role: dto.role.trim(),
        ...(dto.level !== undefined && { level: dto.level.trim() }),
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        active: dto.active ?? true,
        ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
      },
    });

    return this.mapToDto(member);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto> {
    await this.findOne(id);

    const data: Prisma.MemberUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.nickname !== undefined) data.nickname = dto.nickname ? dto.nickname.trim() : null;
    if (dto.role !== undefined) data.role = dto.role.trim();
    if (dto.level !== undefined) data.level = dto.level ? dto.level.trim() : null;
    if (dto.email !== undefined) data.email = dto.email ? dto.email.trim().toLowerCase() : null;
    if (dto.phone !== undefined) data.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.notes !== undefined) data.notes = dto.notes ? dto.notes.trim() : null;

    const updated = await this.prisma.member.update({
      where: { id },
      data,
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.member.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa thành viên thành công' };
  }

  private mapToDto(member: {
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
  }): MemberDto {
    return {
      id: member.id,
      name: member.name,
      nickname: member.nickname,
      role: member.role,
      level: member.level,
      email: member.email,
      phone: member.phone,
      active: member.active,
      notes: member.notes,
      created_at: member.created_at.toISOString(),
      updated_at: member.updated_at.toISOString(),
    };
  }
}
