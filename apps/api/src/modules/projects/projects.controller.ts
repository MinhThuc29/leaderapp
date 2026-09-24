import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, ProjectDto, ProjectMemberDto, ProjectProgressSnapshotDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('Projects')
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách dự án (hỗ trợ lọc status, health_status, tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Danh sách dự án' })
  async findAll(@Query() query: QueryProjectDto): Promise<ProjectDto[]> {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một dự án và danh sách thành viên tham gia' })
  @ApiResponse({ status: 200, description: 'Chi tiết dự án' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectDto> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo dự án mới' })
  @ApiResponse({ status: 201, description: 'Dự án được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Mã dự án đã tồn tại' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectsService.create(user.id, dto);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Cập nhật tiến độ dự án và lưu lại snapshot' })
  @ApiResponse({ status: 200, description: 'Cập nhật tiến độ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
  ): Promise<ProjectDto> {
    return this.projectsService.updateProgress(id, dto.manual_progress, dto.note);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc tiến độ dự án' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa dự án (Soft delete)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.projectsService.remove(id);
  }

  @Get(':id/snapshots')
  @ApiOperation({ summary: 'Lấy lịch sử snapshot tiến độ của dự án' })
  @ApiResponse({ status: 200, description: 'Lịch sử snapshot tiến độ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async getSnapshots(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectProgressSnapshotDto[]> {
    return this.projectsService.getSnapshots(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Gán thành viên vào dự án với vai trò cụ thể' })
  @ApiResponse({ status: 201, description: 'Gán thành viên thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án hoặc thành viên' })
  async assignMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMemberDto,
  ): Promise<ProjectMemberDto> {
    return this.projectsService.assignMember(id, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Gỡ thành viên khỏi dự án (ghi nhận ngày rời left_at)' })
  @ApiResponse({ status: 200, description: 'Gỡ thành viên thành công' })
  @ApiResponse({ status: 404, description: 'Thành viên không thuộc dự án' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<{ message: string }> {
    return this.projectsService.removeMember(id, memberId);
  }
}
