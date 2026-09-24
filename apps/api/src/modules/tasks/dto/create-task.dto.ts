import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Xây dựng API xác thực JWT', description: 'Tiêu đề công việc' })
  @IsString({ message: 'Tiêu đề công việc phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
  title!: string;

  @ApiPropertyOptional({ example: 'Cài đặt cookie parser, guards, và passport strategy' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM, description: 'Mức độ ưu tiên' })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO, description: 'Trạng thái công việc' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2026-10-15', description: 'Hạn chót (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Giờ hạn chót (HH:mm)' })
  @IsString()
  @IsOptional()
  due_time?: string;

  @ApiPropertyOptional({ example: 3, description: 'Trọng số công việc (1-5), dùng để tính tiến độ dự án tự động' })
  @IsInt()
  @Min(1, { message: 'Trọng số tối thiểu là 1' })
  @Max(5, { message: 'Trọng số tối đa là 5' })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'ID dự án liên quan' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'ID thành viên phụ trách (Member)' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'ID thành viên phụ trách (Alias cho member_id)' })
  @IsUUID('4')
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'ID cột mốc liên kết (Milestone)' })
  @IsUUID('4')
  @IsOptional()
  milestone_id?: string;
}
