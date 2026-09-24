import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, TodayResponseDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TodayService } from './today.service';

@ApiTags('Today')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('today')
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy toàn bộ dữ liệu cho màn hình My Day (Tasks hôm nay, Tasks quá hạn, Follow-ups đang chờ, Quick notes, Thống kê)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu tổng hợp màn hình hôm nay',
  })
  async getTodaySummary(
    @CurrentUser() user: AuthUser,
  ): Promise<TodayResponseDto> {
    return this.todayService.getTodaySummary(user.id);
  }
}
