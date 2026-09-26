import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class QueryNotificationDto {
  @ApiPropertyOptional({ enum: NotificationType, description: 'Lọc theo loại thông báo' })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Lọc thông báo chưa đọc (true/false)' })
  @IsBooleanString()
  @IsOptional()
  unread?: string;
}
