import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Severity, Probability, RiskStatus } from '@prisma/client';

export class RiskFilterDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4', { message: 'projectId phải là UUID' })
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ enum: RiskStatus, description: 'Lọc theo trạng thái rủi ro' })
  @IsEnum(RiskStatus)
  @IsOptional()
  status?: RiskStatus;

  @ApiPropertyOptional({ enum: Severity, description: 'Lọc theo mức độ nghiêm trọng (Severity / Impact)' })
  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @ApiPropertyOptional({ enum: Probability, description: 'Lọc theo xác suất rủi ro' })
  @IsEnum(Probability)
  @IsOptional()
  probability?: Probability;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề hoặc mô tả rủi ro' })
  @IsString()
  @IsOptional()
  search?: string;
}
