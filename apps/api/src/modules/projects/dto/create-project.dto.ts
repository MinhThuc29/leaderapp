import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HealthStatus, Priority, ProgressMode, ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'LeaderOS Platform', description: 'Tên dự án' })
  @IsString({ message: 'Tên dự án phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên dự án không được để trống' })
  name!: string;

  @ApiProperty({ example: 'LEADER-OS', description: 'Mã dự án (duy nhất)' })
  @IsString({ message: 'Mã dự án phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã dự án không được để trống' })
  code!: string;

  @ApiPropertyOptional({
    example: 'Hệ thống quản trị cá nhân và hỗ trợ ra quyết định cho Engineering Leader',
    description: 'Mô tả mục tiêu dự án',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
    description: 'Trạng thái dự án',
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProgressMode,
    default: ProgressMode.MANUAL,
    description: 'Chế độ tính tiến độ (MANUAL / AUTO)',
  })
  @IsEnum(ProgressMode)
  @IsOptional()
  progress_mode?: ProgressMode;

  @ApiPropertyOptional({ example: 0, description: 'Tiến độ thủ công (0 - 100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  manual_progress?: number;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Ngày mục tiêu hoàn thành (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  target_date?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM, description: 'Mức độ ưu tiên' })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    enum: HealthStatus,
    default: HealthStatus.GREEN,
    description: 'Tình trạng sức khỏe dự án (GREEN / YELLOW / RED)',
  })
  @IsEnum(HealthStatus)
  @IsOptional()
  health_status?: HealthStatus;

  @ApiPropertyOptional({
    example: 'Cần tập trung hoàn thành MVP trước tháng 11',
    description: 'Nhận định riêng của Leader',
  })
  @IsString()
  @IsOptional()
  leader_note?: string;
}
