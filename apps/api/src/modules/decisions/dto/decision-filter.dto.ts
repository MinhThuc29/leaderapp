import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DecisionStatus } from '@prisma/client';

export class DecisionFilterDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4', { message: 'projectId phải là UUID' })
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ enum: DecisionStatus, description: 'Lọc theo trạng thái quyết định' })
  @IsEnum(DecisionStatus)
  @IsOptional()
  status?: DecisionStatus;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề, bối cảnh, lý do, kỳ vọng' })
  @IsString()
  @IsOptional()
  search?: string;
}
