import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Xây dựng API xác thực JWT v2' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Cập nhật tài liệu kỹ thuật' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsString()
  @IsOptional()
  due_date?: string | null;

  @ApiPropertyOptional({ example: '17:00' })
  @IsString()
  @IsOptional()
  due_time?: string | null;

  @ApiPropertyOptional({ example: 4, description: 'Trọng số công việc (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({ description: 'ID thành viên phụ trách' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string | null;

  @ApiPropertyOptional({ description: 'ID thành viên phụ trách (Alias)' })
  @IsUUID('4')
  @IsOptional()
  assignee_id?: string | null;

  @ApiPropertyOptional({ description: 'ID cột mốc liên kết' })
  @IsUUID('4')
  @IsOptional()
  milestone_id?: string | null;

  @ApiPropertyOptional({ example: 'Chuyển sang DOING do đã chốt phương án', description: 'Ghi chú thay đổi trạng thái' })
  @IsString()
  @IsOptional()
  status_note?: string | undefined;
}
