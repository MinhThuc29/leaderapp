import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LearningStatus, Priority } from '@prisma/client';

export class UpdateLearningItemDto {
  @ApiPropertyOptional({
    example: 'Distributed Systems & Consensus',
    description: 'Chủ đề học tập (Title)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Chủ đề học tập (Alias cho title)',
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({
    example: 'System Design',
    description: 'Danh mục chủ đề',
  })
  @IsString()
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    enum: Priority,
    description: 'Mức độ ưu tiên',
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Trạng thái học tập: BACKLOG (TO_LEARN), LEARNING (IN_PROGRESS), PAUSED, COMPLETED',
  })
  @IsString()
  @IsOptional()
  status?: LearningStatus | string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Hạn chót mục tiêu hoàn thành (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  target_date?: string | null;

  @ApiPropertyOptional({
    description: 'Đường dẫn tài liệu học tập',
  })
  @IsString()
  @IsOptional()
  resource_url?: string | null;

  @ApiPropertyOptional({
    description: 'Đường dẫn tài liệu học tập (Alias)',
  })
  @IsString()
  @IsOptional()
  source_url?: string | null;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm',
  })
  @IsString()
  @IsOptional()
  notes?: string | null;
}
