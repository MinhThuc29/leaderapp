import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class QueryMilestoneDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ enum: MilestoneStatus, description: 'Lọc theo trạng thái cột mốc' })
  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus;
}
