import {
  Controller,
  Get,
  Patch,
  Delete,
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
import { NotificationDto, NotificationListResponse } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@ApiTags('notifications')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo và tự động quét dữ liệu thật từ SQL' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo và thống kê' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationDto,
  ): Promise<NotificationListResponse> {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<{ updatedCount: number }> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu hoặc đổi trạng thái đã đọc của thông báo' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  async toggleRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationDto> {
    return this.notificationsService.toggleRead(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Huỷ / Xoá thông báo' })
  @ApiResponse({ status: 200, description: 'Xoá thông báo thành công' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.notificationsService.delete(userId, id);
    return { message: 'Đã xoá thông báo thành công' };
  }
}
