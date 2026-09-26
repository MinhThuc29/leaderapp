import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MeetingDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: {
    project: { select: { id: true; name: true; code: true } };
    member: true;
  };
}>;

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<MeetingDto[]> {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
      orderBy: { start_time: 'asc' },
    });

    return meetings.map((m) => this.mapToDto(m));
  }

  async findOne(userId: string, id: string): Promise<MeetingDto> {
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id,
        owner_id: userId,
        deleted_at: null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException(`Không tìm thấy cuộc họp với ID: ${id}`);
    }

    return this.mapToDto(meeting);
  }

  async create(userId: string, dto: CreateMeetingDto): Promise<MeetingDto> {
    const created = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        location: dto.location ?? null,
        meeting_url: dto.meeting_url ?? null,
        start_time: new Date(dto.start_time),
        end_time: dto.end_time ? new Date(dto.end_time) : null,
        status: dto.status ?? 'UPCOMING',
        agenda: dto.agenda ?? null,
        notes: dto.notes ?? null,
        project_id: dto.project_id ?? null,
        member_id: dto.member_id ?? null,
        owner_id: userId,
      },
    });

    return this.findOne(userId, created.id);
  }

  async update(userId: string, id: string, dto: UpdateMeetingDto): Promise<MeetingDto> {
    await this.findOne(userId, id);

    await this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.meeting_url !== undefined && { meeting_url: dto.meeting_url }),
        ...(dto.start_time !== undefined && { start_time: new Date(dto.start_time) }),
        ...(dto.end_time !== undefined && { end_time: dto.end_time ? new Date(dto.end_time) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.agenda !== undefined && { agenda: dto.agenda }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.project_id !== undefined && { project_id: dto.project_id }),
        ...(dto.member_id !== undefined && { member_id: dto.member_id }),
      },
    });

    return this.findOne(userId, id);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.meeting.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  private mapToDto(m: MeetingWithRelations): MeetingDto {
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      location: m.location,
      meeting_url: m.meeting_url,
      start_time: m.start_time.toISOString(),
      end_time: m.end_time ? m.end_time.toISOString() : null,
      status: m.status,
      agenda: m.agenda,
      notes: m.notes,
      project_id: m.project_id,
      member_id: m.member_id,
      owner_id: m.owner_id,
      created_at: m.created_at.toISOString(),
      updated_at: m.updated_at.toISOString(),
      project: m.project
        ? { id: m.project.id, name: m.project.name, code: m.project.code }
        : undefined,
      member: m.member
        ? {
            id: m.member.id,
            name: m.member.name,
            nickname: m.member.nickname,
            role: m.member.role,
            level: m.member.level,
            email: m.member.email,
            phone: m.member.phone,
            active: m.member.active,
            notes: m.member.notes,
            created_at: m.member.created_at.toISOString(),
            updated_at: m.member.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}
