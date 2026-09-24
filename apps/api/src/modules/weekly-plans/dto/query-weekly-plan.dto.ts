import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { WeeklyPlanStatus } from '@leaderos/shared-types';

export class QueryWeeklyPlanDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4', { message: 'projectId phải là UUID hợp lệ' })
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo năm', example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Lọc theo tuần', example: 39 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(53)
  @IsOptional()
  week?: number;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái', enum: WeeklyPlanStatus })
  @IsEnum(WeeklyPlanStatus)
  @IsOptional()
  status?: WeeklyPlanStatus;
}
