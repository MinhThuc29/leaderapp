import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Priority } from '@prisma/client';

export class QueryLearningItemDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái học tập (BACKLOG, LEARNING, PAUSED, COMPLETED, hoặc TO_LEARN, IN_PROGRESS)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo danh mục chủ đề',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    enum: Priority,
    description: 'Lọc theo độ ưu tiên',
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Tìm kiếm từ khóa theo chủ đề hoặc ghi chú',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
