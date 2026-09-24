import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  WeeklyPlanDto,
  WeeklyReviewDto,
} from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WeeklyPlansService } from './weekly-plans.service';
import { CreateWeeklyPlanDto } from './dto/create-weekly-plan.dto';
import { UpdateWeeklyPlanDto } from './dto/update-weekly-plan.dto';
import { AssignWeeklyTasksDto } from './dto/assign-weekly-tasks.dto';
import { CreateWeeklyReviewDto } from './dto/create-weekly-review.dto';
import { QueryWeeklyPlanDto } from './dto/query-weekly-plan.dto';

@ApiTags('Weekly Plans')
@UseGuards(AuthGuard)
@Controller('weekly-plans')
export class WeeklyPlansController {
  constructor(private readonly weeklyPlansService: WeeklyPlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo kế hoạch tuần cho dự án' })
  @ApiResponse({ status: 201, description: 'Tạo kế hoạch tuần thành công' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWeeklyPlanDto,
  ): Promise<WeeklyPlanDto> {
    return this.weeklyPlansService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Danh sách kế hoạch tuần' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryWeeklyPlanDto,
  ): Promise<WeeklyPlanDto[]> {
    return this.weeklyPlansService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Chi tiết kế hoạch tuần' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WeeklyPlanDto> {
    return this.weeklyPlansService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật mục tiêu / trạng thái kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWeeklyPlanDto,
  ): Promise<WeeklyPlanDto> {
    return this.weeklyPlansService.update(user.id, id, dto);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Gán danh sách tasks vào kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Gán tasks thành công' })
  async assignTasks(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignWeeklyTasksDto,
  ): Promise<WeeklyPlanDto> {
    return this.weeklyPlansService.assignTasks(user.id, id, dto);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Loại bỏ một task khỏi kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Đã loại bỏ task khỏi kế hoạch' })
  async removeTask(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<WeeklyPlanDto> {
    return this.weeklyPlansService.removeTask(user.id, id, taskId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Ghi nhận hoặc cập nhật đánh giá tuần (Weekly Review)' })
  @ApiResponse({ status: 200, description: 'Lưu đánh giá tuần thành công' })
  async createOrUpdateReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWeeklyReviewDto,
  ): Promise<WeeklyReviewDto> {
    return this.weeklyPlansService.createOrUpdateReview(user.id, id, dto);
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Lấy thông tin đánh giá tuần' })
  @ApiResponse({ status: 200, description: 'Chi tiết Weekly Review' })
  async getReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WeeklyReviewDto> {
    return this.weeklyPlansService.getReview(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa kế hoạch tuần' })
  @ApiResponse({ status: 200, description: 'Xóa kế hoạch thành công' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.weeklyPlansService.remove(user.id, id);
  }
}
