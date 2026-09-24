import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { FollowUpStatus } from '@prisma/client';

export class CreateFollowUpDto {
  @ApiProperty({
    example: 'Chờ phản hồi báo giá linh kiện từ Vendor A',
    description: 'Tiêu đề nội dung cần follow up',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title!: string;

  @ApiProperty({
    example: 'Vendor A / Nguyễn Văn A',
    description: 'Đối tượng đang chờ phản hồi (người, khách hàng, đối tác)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Đối tượng chờ phản hồi không được để trống' })
  waiting_for!: string;

  @ApiProperty({
    example: '2026-09-25',
    description: 'Ngày hẹn cần hỏi lại (YYYY-MM-DD)',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày follow-up phải theo định dạng YYYY-MM-DD',
  })
  @IsNotEmpty({ message: 'Ngày follow-up không được để trống' })
  follow_up_date!: string;

  @ApiPropertyOptional({
    enum: FollowUpStatus,
    example: FollowUpStatus.WAITING,
    description: 'Trạng thái theo dõi',
    default: FollowUpStatus.WAITING,
  })
  @IsEnum(FollowUpStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: FollowUpStatus;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID dự án liên quan (nếu có)',
  })
  @IsUUID('4', { message: 'ID dự án phải là UUID hợp lệ' })
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID thành viên nội bộ liên quan (nếu có)',
  })
  @IsUUID('4', { message: 'ID thành viên phải là UUID hợp lệ' })
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({
    example: 'Đã gửi email nhắc lần 1 qua outlook',
    description: 'Ghi chú thêm',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
