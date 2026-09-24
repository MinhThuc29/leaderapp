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
  ApiQuery,
} from '@nestjs/swagger';
import { RiskDto, RiskMatrixDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RiskFilterDto } from './dto/risk-filter.dto';

@ApiTags('risks')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo rủi ro mới trong dự án' })
  @ApiResponse({ status: 201, description: 'Tạo rủi ro thành công' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRiskDto,
  ): Promise<RiskDto> {
    return this.risksService.create(userId, dto);
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Lấy dữ liệu Ma trận Rủi ro (Probability x Impact Heatmap)' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Lọc theo ID dự án' })
  @ApiResponse({ status: 200, description: 'Dữ liệu ma trận rủi ro' })
  async getMatrix(
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ): Promise<RiskMatrixDto> {
    return this.risksService.getMatrix(userId, projectId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách rủi ro (có bộ lọc dự án, trạng thái, mức độ)' })
  @ApiResponse({ status: 200, description: 'Danh sách rủi ro' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: RiskFilterDto,
  ): Promise<RiskDto[]> {
    return this.risksService.findAll(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết rủi ro theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết rủi ro' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rủi ro' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RiskDto> {
    return this.risksService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc trạng thái rủi ro' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rủi ro' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRiskDto,
  ): Promise<RiskDto> {
    return this.risksService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm rủi ro' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rủi ro' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; id: string }> {
    return this.risksService.remove(userId, id);
  }
}
