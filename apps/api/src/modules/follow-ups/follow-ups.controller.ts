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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, FollowUpDto } from '@leaderos/shared-types';
import { FollowUpStatus } from '@prisma/client';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { QueryFollowUpDto } from './dto/query-follow-up.dto';

@ApiTags('Follow-ups')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới hạng mục cần follow up' })
  @ApiResponse({ status: 201, description: 'Tạo follow up thành công' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFollowUpDto,
  ): Promise<FollowUpDto> {
    return this.followUpsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách follow-ups theo bộ lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách follow-ups' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryFollowUpDto,
  ): Promise<FollowUpDto[]> {
    return this.followUpsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một follow-up' })
  @ApiResponse({ status: 200, description: 'Chi tiết follow-up' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy follow-up' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FollowUpDto> {
    return this.followUpsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin follow-up' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy follow-up' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFollowUpDto,
  ): Promise<FollowUpDto> {
    return this.followUpsService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật nhanh trạng thái follow-up (WAITING, RESOLVED, CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy follow-up' })
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: FollowUpStatus,
  ): Promise<FollowUpDto> {
    return this.followUpsService.updateStatus(user.id, id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa mềm follow-up' })
  @ApiResponse({ status: 200, description: 'Xóa follow-up thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy follow-up' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.followUpsService.remove(user.id, id);
  }
}
