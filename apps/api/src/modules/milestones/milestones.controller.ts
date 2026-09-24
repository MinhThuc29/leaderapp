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
import { MilestoneDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { QueryMilestoneDto } from './dto/query-milestone.dto';

@ApiTags('Milestones')
@UseGuards(AuthGuard)
@Controller('milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cột mốc (hỗ trợ lọc theo project_id, status)' })
  @ApiResponse({ status: 200, description: 'Danh sách cột mốc' })
  async findAll(@Query() query: QueryMilestoneDto): Promise<MilestoneDto[]> {
    return this.milestonesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo cột mốc mới cho dự án' })
  @ApiResponse({ status: 201, description: 'Cột mốc được tạo thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy dự án' })
  async create(@Body() dto: CreateMilestoneDto): Promise<MilestoneDto> {
    return this.milestonesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một cột mốc' })
  @ApiResponse({ status: 200, description: 'Chi tiết cột mốc' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cột mốc' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MilestoneDto> {
    return this.milestonesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc trạng thái cột mốc' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cột mốc' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMilestoneDto,
  ): Promise<MilestoneDto> {
    return this.milestonesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cột mốc (Soft delete)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cột mốc' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.milestonesService.remove(id);
  }
}
