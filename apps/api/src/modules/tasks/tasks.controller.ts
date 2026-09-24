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
import { AuthUser, RescheduleTomorrowResultDto, TaskDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@ApiTags('Tasks')
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy danh sách công việc (hỗ trợ lọc theo project, member, milestone, status, priority, overdue)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách công việc' })
  async findAll(@Query() query: QueryTaskDto): Promise<TaskDto[]> {
    return this.tasksService.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary:
      'Tạo công việc mới (tự động ghi nhận lịch sử trạng thái và tính lại tiến độ dự án)',
  })
  @ApiResponse({ status: 201, description: 'Tạo công việc thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án hoặc thành viên' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDto> {
    return this.tasksService.create(user.id, dto);
  }

  @Post('reschedule-tomorrow')
  @ApiOperation({
    summary:
      'Chuyển tất cả công việc dở dang quá hạn (due_date < today & chưa xong) sang hạn ngày mai',
  })
  @ApiResponse({
    status: 200,
    description: 'Dời hạn các công việc quá hạn sang ngày mai thành công',
  })
  async rescheduleTomorrow(
    @CurrentUser() user: AuthUser,
  ): Promise<RescheduleTomorrowResultDto> {
    return this.tasksService.rescheduleTomorrow(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết công việc kèm lịch sử thay đổi trạng thái' })
  @ApiResponse({ status: 200, description: 'Chi tiết công việc' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TaskDto> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Cập nhật nhanh trạng thái công việc (chuyển TODO -> DOING -> DONE, tự động ghi log và tính lại % tiến độ dự án)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<TaskDto> {
    return this.tasksService.updateStatus(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chi tiết công việc' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa công việc (Soft delete và tự động cập nhật lại tiến độ dự án)',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.tasksService.remove(id);
  }
}
