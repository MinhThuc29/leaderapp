import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, DashboardSummaryDto, NeedAttentionItem } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { NeedAttentionService } from './need-attention.service';

@ApiTags('Dashboard')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly needAttentionService: NeedAttentionService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Lấy toàn bộ chỉ số tổng hợp hệ thống & cảnh báo Need Attention trong 1 round-trip',
  })
  @ApiResponse({ status: 200, description: 'Tổng hợp chỉ số Dashboard' })
  async getSummary(@CurrentUser() user: AuthUser): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Alias lấy tổng hợp chỉ số Dashboard' })
  @ApiResponse({ status: 200, description: 'Tổng hợp chỉ số Dashboard' })
  async getDashboard(@CurrentUser() user: AuthUser): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(user.id);
  }

  @Get('need-attention')
  @ApiOperation({ summary: 'Quét và lấy danh sách các cảnh báo rủi ro (Need Attention Engine)' })
  @ApiResponse({ status: 200, description: 'Danh sách cảnh báo cần chú ý' })
  async getNeedAttention(
    @CurrentUser() user: AuthUser,
  ): Promise<{
    total_count: number;
    critical_count: number;
    warning_count: number;
    attention_count: number;
    items: NeedAttentionItem[];
  }> {
    return this.needAttentionService.scan(user.id);
  }
}
