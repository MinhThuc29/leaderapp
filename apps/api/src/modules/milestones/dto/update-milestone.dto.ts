import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ example: 'Phát hành bản Alpha MVP' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Mô tả chi tiết cột mốc' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: MilestoneStatus })
  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Ngày mục tiêu (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  target_date?: string;

  @ApiPropertyOptional({ example: '2026-10-25', description: 'Ngày thực tế hoàn thành (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  completed_date?: string;

  @ApiPropertyOptional({ example: 100, description: 'Tiến độ hoàn thành (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự hiển thị' })
  @IsInt()
  @IsOptional()
  order?: number;
}
