import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'b0a7d90e-8f2c-4736-b891-cb66f7b589e5', description: 'ID dự án' })
  @IsUUID('4', { message: 'project_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'project_id không được để trống' })
  project_id!: string;

  @ApiProperty({ example: 'Phát hành bản Alpha MVP', description: 'Tiêu đề cột mốc' })
  @IsString({ message: 'Tiêu đề cột mốc phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề cột mốc không được để trống' })
  title!: string;

  @ApiPropertyOptional({ example: 'Đóng gói toàn bộ tính năng cốt lõi cho khách hàng thử nghiệm' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: MilestoneStatus, default: MilestoneStatus.NOT_STARTED })
  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus;

  @ApiProperty({ example: '2026-10-31', description: 'Hạn chót mục tiêu (YYYY-MM-DD)' })
  @IsString({ message: 'target_date phải là định dạng ngày YYYY-MM-DD' })
  @IsNotEmpty({ message: 'target_date không được để trống' })
  target_date!: string;

  @ApiPropertyOptional({ example: 0, description: 'Tiến độ hoàn thành của cột mốc (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ example: 0, description: 'Thứ tự hiển thị' })
  @IsInt()
  @IsOptional()
  order?: number;
}
