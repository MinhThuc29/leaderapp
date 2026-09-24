import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { FollowUpStatus } from '@prisma/client';

export class UpdateFollowUpDto {
  @ApiPropertyOptional({
    example: 'Chờ phản hồi báo giá linh kiện từ Vendor A',
    description: 'Tiêu đề nội dung cần follow up',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Vendor A / Nguyễn Văn A',
    description: 'Đối tượng đang chờ phản hồi',
  })
  @IsString()
  @IsOptional()
  waiting_for?: string;

  @ApiPropertyOptional({
    example: '2026-09-25',
    description: 'Ngày hẹn cần hỏi lại (YYYY-MM-DD)',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày follow-up phải theo định dạng YYYY-MM-DD',
  })
  @IsOptional()
  follow_up_date?: string;

  @ApiPropertyOptional({
    enum: FollowUpStatus,
    example: FollowUpStatus.RESOLVED,
    description: 'Trạng thái theo dõi',
  })
  @IsEnum(FollowUpStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: FollowUpStatus;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID dự án liên quan',
  })
  @IsUUID('4', { message: 'ID dự án phải là UUID hợp lệ' })
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID thành viên nội bộ liên quan',
  })
  @IsUUID('4', { message: 'ID thành viên phải là UUID hợp lệ' })
  @IsOptional()
  member_id?: string | null;

  @ApiPropertyOptional({
    example: 'Đối tác đã xác nhận qua Zalo',
    description: 'Ghi chú thêm',
  })
  @IsString()
  @IsOptional()
  note?: string | null;
}
