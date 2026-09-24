import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { HealthStatus, ProjectStatus } from '@prisma/client';

export class QueryProjectDto {
  @ApiPropertyOptional({ example: 'LeaderOS', description: 'Tìm kiếm theo tên hoặc mã dự án' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Lọc theo trạng thái dự án' })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: HealthStatus, description: 'Lọc theo tình trạng sức khỏe (GREEN / YELLOW / RED)' })
  @IsEnum(HealthStatus)
  @IsOptional()
  health_status?: HealthStatus;
}
