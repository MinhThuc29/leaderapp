import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { FollowUpStatus } from '@prisma/client';

export class QueryFollowUpDto {
  @ApiPropertyOptional({
    enum: FollowUpStatus,
    description: 'Lọc theo trạng thái follow-up (WAITING, RESOLVED, CANCELLED)',
  })
  @IsEnum(FollowUpStatus)
  @IsOptional()
  status?: FollowUpStatus;

  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID thành viên nội bộ' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề hoặc người cần chờ' })
  @IsString()
  @IsOptional()
  search?: string;
}
