import { Injectable, NotFoundException } from '@nestjs/common';
import { NoteType, Prisma } from '@prisma/client';
import { MemberDto, NoteDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuick(userId: string, dto: CreateQuickNoteDto): Promise<NoteDto> {
    const trimmedContent = dto.content.trim();
    let title = dto.title?.trim();

    if (!title) {
      // Tự động trích xuất tiêu đề từ dòng đầu hoặc 50 ký tự đầu tiên
      const firstLine = trimmedContent.split('\n')[0] ?? '';
      title = firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
      if (!title) {
        title = 'Ghi chú nhanh';
      }
    }

    const note = await this.prisma.note.create({
      data: {
        title,
        content: trimmedContent,
        type: NoteType.GENERAL,
        source: 'QUICK',
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
      },
    });

    return this.mapToDto(note);
  }

  async create(userId: string, dto: CreateNoteDto): Promise<NoteDto> {
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

    const noteType = dto.category ?? dto.type ?? NoteType.GENERAL;

    const note = await this.prisma.note.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: noteType,
        source: 'NORMAL',
        project_id: dto.project_id ?? null,
        member_id: dto.member_id ?? null,
        is_pinned: dto.is_pinned ?? false,
        owner_id: userId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
        note_tags: { include: { tag: true } },
      },
    });

    if (dto.tags && dto.tags.length > 0) {
      await this.syncTags(note.id, dto.tags);
      return this.findOne(userId, note.id);
    }

    return this.mapToDto(note);
  }

  async findAll(userId: string, query: QueryNoteDto): Promise<NoteDto[]> {
    const where: Prisma.NoteWhereInput = {
      owner_id: userId,
      deleted_at: null,
    };

    const effectiveType = query.category ?? query.type;
    if (effectiveType) {
      where.type = effectiveType;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.member_id) {
      where.member_id = query.member_id;
    }

    if (query.tag?.trim()) {
      where.note_tags = {
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
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await this.prisma.note.findMany({
      where,
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
        note_tags: { include: { tag: true } },
      },
    });

    return notes.map((n) => this.mapToDto(n));
  }

  async findOne(userId: string, id: string): Promise<NoteDto> {
    const note = await this.prisma.note.findFirst({
      where: { id, owner_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        member: true,
        note_tags: { include: { tag: true } },
      },
    });

    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú với ID: ${id}`);
    }

    return this.mapToDto(note);
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<NoteDto> {
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

    const data: Prisma.NoteUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.content !== undefined) data.content = dto.content.trim();
    const effectiveType = dto.category ?? dto.type;
    if (effectiveType !== undefined) data.type = effectiveType;
    if (dto.is_pinned !== undefined) data.is_pinned = dto.is_pinned;
    if (dto.project_id !== undefined) {
      data.project = dto.project_id ? { connect: { id: dto.project_id } } : { disconnect: true };
    }
    if (dto.member_id !== undefined) {
      data.member = dto.member_id ? { connect: { id: dto.member_id } } : { disconnect: true };
    }

    await this.prisma.note.update({
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

    await this.prisma.note.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa ghi chú thành công' };
  }

  private async syncTags(noteId: string, tagNames: string[]): Promise<void> {
    await this.prisma.noteTag.deleteMany({ where: { note_id: noteId } });

    const cleanNames = Array.from(
      new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean))
    );

    for (const name of cleanNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.noteTag.create({
        data: { note_id: noteId, tag_id: tag.id },
      });
    }
  }

  private mapToDto(note: {
    id: string;
    title: string;
    content: string;
    type: NoteType;
    project_id: string | null;
    member_id: string | null;
    is_pinned: boolean;
    source: string;
    converted_to: string | null;
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
    note_tags?: Array<{ tag: { name: string } }> | null;
  }): NoteDto {
    let memberDto: MemberDto | undefined = undefined;
    if (note.member) {
      memberDto = {
        id: note.member.id,
        name: note.member.name,
        nickname: note.member.nickname,
        role: note.member.role,
        level: note.member.level,
        email: note.member.email,
        phone: note.member.phone,
        active: note.member.active,
        notes: note.member.notes,
        created_at: note.member.created_at.toISOString(),
        updated_at: note.member.updated_at.toISOString(),
      };
    }

    const tags = (note.note_tags ?? []).map((nt) => nt.tag.name);

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      type: note.type,
      category: note.type,
      project_id: note.project_id,
      member_id: note.member_id,
      is_pinned: note.is_pinned,
      source: note.source,
      converted_to: note.converted_to,
      owner_id: note.owner_id,
      created_at: note.created_at.toISOString(),
      updated_at: note.updated_at.toISOString(),
      tags,
      project: note.project ? { id: note.project.id, name: note.project.name, code: note.project.code } : undefined,
      member: memberDto,
    };
  }
}
