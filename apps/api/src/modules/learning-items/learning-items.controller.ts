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
import { LearningItemDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LearningItemsService } from './learning-items.service';
import { CreateLearningItemDto } from './dto/create-learning-item.dto';
import { UpdateLearningItemDto } from './dto/update-learning-item.dto';
import { UpdateLearningStatusDto } from './dto/update-learning-status.dto';
import { QueryLearningItemDto } from './dto/query-learning-item.dto';

@ApiTags('Learning Items')
@UseGuards(AuthGuard)
@Controller('learning-items')
export class LearningItemsController {
  constructor(private readonly learningItemsService: LearningItemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm mới chủ đề cần học' })
  @ApiResponse({ status: 201, description: 'Tạo chủ đề học tập thành công' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLearningItemDto,
  ): Promise<LearningItemDto> {
    return this.learningItemsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các chủ đề học tập' })
  @ApiResponse({ status: 200, description: 'Danh sách chủ đề học tập' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryLearningItemDto,
  ): Promise<LearningItemDto[]> {
    return this.learningItemsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một chủ đề học tập' })
  @ApiResponse({ status: 200, description: 'Chi tiết chủ đề học tập' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LearningItemDto> {
    return this.learningItemsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chủ đề học tập' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningItemDto,
  ): Promise<LearningItemDto> {
    return this.learningItemsService.update(userId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật nhanh trạng thái học tập (1-click transition)' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningStatusDto,
  ): Promise<LearningItemDto> {
    return this.learningItemsService.updateStatus(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm chủ đề học tập' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.learningItemsService.remove(userId, id);
  }
}
