import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Severity, IncidentStatus } from '@prisma/client';

export class IncidentFilterDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4', { message: 'projectId phải là UUID' })
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ enum: IncidentStatus, description: 'Lọc theo trạng thái sự cố' })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: Severity, description: 'Lọc theo mức độ nghiêm trọng' })
  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề, mô tả hoặc nguyên nhân' })
  @IsString()
  @IsOptional()
  search?: string;
}
