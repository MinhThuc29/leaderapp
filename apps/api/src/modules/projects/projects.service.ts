import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HealthStatus,
  Priority,
  ProgressMode,
  ProjectStatus,
  Prisma,
} from '@prisma/client';
import { ProjectDto, ProjectMemberDto, ProjectProgressSnapshotDto } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { AssignMemberDto } from './dto/assign-member.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProjectDto): Promise<ProjectDto[]> {
    const where: Prisma.ProjectWhereInput = {
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.health_status) {
      where.health_status = query.health_status;
    }

    if (query.search && query.search.trim() !== '') {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        project_members: {
          where: { left_at: null },
          include: { member: true },
        },
      },
      orderBy: [{ created_at: 'desc' }],
    });

    return projects.map((p) => this.mapToDto(p));
  }

  async findOne(id: string): Promise<ProjectDto> {
    const project = await this.prisma.project.findFirst({
      where: { id, deleted_at: null },
      include: {
        project_members: {
          include: { member: true },
          orderBy: { joined_at: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án với ID: ${id}`);
    }

    return this.mapToDto(project);
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.project.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new BadRequestException(`Mã dự án '${normalizedCode}' đã tồn tại`);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        code: normalizedCode,
        ...(dto.description !== undefined && { description: dto.description.trim() }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.progress_mode !== undefined && { progress_mode: dto.progress_mode }),
        manual_progress: dto.manual_progress ?? 0,
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.target_date && { target_date: new Date(dto.target_date) }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.health_status !== undefined && { health_status: dto.health_status }),
        ...(dto.leader_note !== undefined && { leader_note: dto.leader_note.trim() }),
        owner_id: userId,
      },
      include: {
        project_members: {
          include: { member: true },
        },
      },
    });

    // Tạo snapshot tiến độ ban đầu
    if (project.manual_progress > 0) {
      await this.prisma.projectProgressSnapshot.create({
        data: {
          project_id: project.id,
          progress: project.manual_progress,
          mode: project.progress_mode,
          health_status: project.health_status,
          note: 'Khởi tạo tiến độ dự án',
        },
      });
    }

    return this.mapToDto(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectDto> {
    const existing = await this.prisma.project.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy dự án với ID: ${id}`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeCheck = await this.prisma.project.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (codeCheck) {
        throw new BadRequestException(`Mã dự án '${dto.code.trim().toUpperCase()}' đã tồn tại`);
      }
    }

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.code !== undefined) data.code = dto.code.trim().toUpperCase();
    if (dto.description !== undefined) data.description = dto.description ? dto.description.trim() : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.progress_mode !== undefined) data.progress_mode = dto.progress_mode;
    if (dto.manual_progress !== undefined) data.manual_progress = dto.manual_progress;
    if (dto.start_date !== undefined) data.start_date = dto.start_date ? new Date(dto.start_date) : null;
    if (dto.target_date !== undefined) data.target_date = dto.target_date ? new Date(dto.target_date) : null;
    if (dto.completed_date !== undefined) data.completed_date = dto.completed_date ? new Date(dto.completed_date) : null;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.health_status !== undefined) data.health_status = dto.health_status;
    if (dto.leader_note !== undefined) data.leader_note = dto.leader_note ? dto.leader_note.trim() : null;

    const updated = await this.prisma.project.update({
      where: { id },
      data,
      include: {
        project_members: {
          include: { member: true },
        },
      },
    });

    // Nếu tiến độ thay đổi -> ghi lại snapshot
    if (
      dto.manual_progress !== undefined &&
      dto.manual_progress !== existing.manual_progress
    ) {
      await this.prisma.projectProgressSnapshot.create({
        data: {
          project_id: updated.id,
          progress: updated.manual_progress,
          mode: updated.progress_mode,
          health_status: updated.health_status,
          note: `Cập nhật tiến độ từ ${existing.manual_progress}% sang ${updated.manual_progress}%`,
        },
      });
    }

    return this.mapToDto(updated);
  }

  async updateProgress(id: string, manual_progress: number, note?: string): Promise<ProjectDto> {
    const existing = await this.prisma.project.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy dự án với ID: ${id}`);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { manual_progress },
      include: {
        project_members: {
          include: { member: true },
        },
      },
    });

    await this.prisma.projectProgressSnapshot.create({
      data: {
        project_id: updated.id,
        progress: manual_progress,
        mode: updated.progress_mode,
        health_status: updated.health_status,
        note: note ?? `Cập nhật tiến độ sang ${manual_progress}%`,
      },
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.project.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Đã xóa dự án thành công' };
  }

  async getSnapshots(projectId: string): Promise<ProjectProgressSnapshotDto[]> {
    await this.findOne(projectId);

    const snapshots = await this.prisma.projectProgressSnapshot.findMany({
      where: { project_id: projectId },
      orderBy: { captured_at: 'desc' },
      take: 50,
    });

    return snapshots.map((s) => ({
      id: s.id,
      project_id: s.project_id,
      progress: s.progress,
      mode: s.mode,
      health_status: s.health_status,
      note: s.note,
      captured_at: s.captured_at.toISOString(),
    }));
  }

  async assignMember(projectId: string, dto: AssignMemberDto): Promise<ProjectMemberDto> {
    await this.findOne(projectId);

    const member = await this.prisma.member.findFirst({
      where: { id: dto.member_id, deleted_at: null },
    });
    if (!member) {
      throw new NotFoundException(`Không tìm thấy thành viên với ID: ${dto.member_id}`);
    }

    const joinedDate = dto.joined_at ? new Date(dto.joined_at) : new Date();

    const projectMember = await this.prisma.projectMember.upsert({
      where: {
        project_id_member_id_joined_at: {
          project_id: projectId,
          member_id: dto.member_id,
          joined_at: joinedDate,
        },
      },
      update: {
        project_role: dto.project_role.trim(),
        allocation_percent: dto.allocation_percent ?? null,
        left_at: null,
      },
      create: {
        project_id: projectId,
        member_id: dto.member_id,
        project_role: dto.project_role.trim(),
        allocation_percent: dto.allocation_percent ?? null,
        joined_at: joinedDate,
      },
      include: {
        member: true,
      },
    });

    return this.mapMemberToDto(projectMember);
  }

  async removeMember(projectId: string, memberId: string): Promise<{ message: string }> {
    await this.findOne(projectId);

    const activeAssignment = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        member_id: memberId,
        left_at: null,
      },
    });

    if (!activeAssignment) {
      throw new NotFoundException('Thành viên không thuộc danh sách đang tham gia dự án này');
    }

    await this.prisma.projectMember.update({
      where: { id: activeAssignment.id },
      data: { left_at: new Date() },
    });

    return { message: 'Đã gỡ thành viên khỏi dự án thành công' };
  }

  private toDateString(date: Date | null): string | null {
    if (!date) return null;
    const parts = date.toISOString().split('T');
    return parts[0] ?? null;
  }

  private mapToDto(project: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    status: ProjectStatus;
    progress_mode: ProgressMode;
    manual_progress: number;
    start_date: Date | null;
    target_date: Date | null;
    completed_date: Date | null;
    priority: Priority;
    health_status: HealthStatus;
    leader_note: string | null;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
    project_members?: Array<{
      id: string;
      project_id: string;
      member_id: string;
      project_role: string;
      allocation_percent: number | null;
      joined_at: Date;
      left_at: Date | null;
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
      };
    }>;
  }): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      progress_mode: project.progress_mode,
      manual_progress: project.manual_progress,
      start_date: this.toDateString(project.start_date),
      target_date: this.toDateString(project.target_date),
      completed_date: this.toDateString(project.completed_date),
      priority: project.priority,
      health_status: project.health_status,
      leader_note: project.leader_note,
      owner_id: project.owner_id,
      created_at: project.created_at.toISOString(),
      updated_at: project.updated_at.toISOString(),
      project_members: project.project_members
        ? project.project_members.map((pm) => this.mapMemberToDto(pm))
        : [],
    };
  }

  private mapMemberToDto(pm: {
    id: string;
    project_id: string;
    member_id: string;
    project_role: string;
    allocation_percent: number | null;
    joined_at: Date;
    left_at: Date | null;
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
    };
  }): ProjectMemberDto {
    return {
      id: pm.id,
      project_id: pm.project_id,
      member_id: pm.member_id,
      project_role: pm.project_role,
      allocation_percent: pm.allocation_percent,
      joined_at: this.toDateString(pm.joined_at) ?? pm.joined_at.toISOString(),
      left_at: this.toDateString(pm.left_at),
      member: pm.member
        ? {
            id: pm.member.id,
            name: pm.member.name,
            nickname: pm.member.nickname,
            role: pm.member.role,
            level: pm.member.level,
            email: pm.member.email,
            phone: pm.member.phone,
            active: pm.member.active,
            notes: pm.member.notes,
            created_at: pm.member.created_at.toISOString(),
            updated_at: pm.member.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}
