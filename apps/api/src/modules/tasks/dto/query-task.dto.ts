import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';

export class QueryTaskDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID thành viên phụ trách' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID thành viên phụ trách (Alias)' })
  @IsUUID('4')
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID cột mốc' })
  @IsUUID('4')
  @IsOptional()
  milestone_id?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Lọc theo trạng thái công việc' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Priority, description: 'Lọc theo độ ưu tiên' })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề hoặc mô tả' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Chỉ lấy các task quá hạn (Overdue)' })
  @IsBooleanString()
  @IsOptional()
  overdue?: string;
}
