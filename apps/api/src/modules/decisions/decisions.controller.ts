import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DecisionDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecisionsService } from './decisions.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { DecisionFilterDto } from './dto/decision-filter.dto';

@ApiTags('decisions')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi nhận quyết định mới vào Sổ quyết định' })
  @ApiResponse({ status: 201, description: 'Ghi nhận quyết định thành công' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDecisionDto,
  ): Promise<DecisionDto> {
    return this.decisionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhật ký quyết định (Timeline / Filter)' })
  @ApiResponse({ status: 200, description: 'Danh sách quyết định' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: DecisionFilterDto,
  ): Promise<DecisionDto[]> {
    return this.decisionsService.findAll(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết quyết định theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết quyết định' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy quyết định' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DecisionDto> {
    return this.decisionsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin quyết định' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy quyết định' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDecisionDto,
  ): Promise<DecisionDto> {
    return this.decisionsService.update(userId, id, dto);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Đánh giá lại quyết định sau 3-6 tháng (ghi nhận actual_result)' })
  @ApiResponse({ status: 200, description: 'Đánh giá quyết định thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy quyết định' })
  async recordReview(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
  ): Promise<DecisionDto> {
    return this.decisionsService.recordReview(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm quyết định' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy quyết định' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; id: string }> {
    return this.decisionsService.remove(userId, id);
  }
}
