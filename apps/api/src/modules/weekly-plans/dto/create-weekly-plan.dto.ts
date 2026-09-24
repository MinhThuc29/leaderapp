import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { CreateWeeklyPlanInput, WeeklyPlanStatus } from '@leaderos/shared-types';

export class CreateWeeklyPlanDto implements CreateWeeklyPlanInput {
  @ApiProperty({ description: 'ID của dự án', example: 'd3b07384-d113-40e1-a08b-626a575459ec' })
  @IsUUID('4', { message: 'project_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'project_id không được để trống' })
  project_id!: string;

  @ApiProperty({ description: 'Số tuần trong năm (1-53)', example: 39 })
  @IsInt({ message: 'week_number phải là số nguyên' })
  @Min(1, { message: 'week_number tối thiểu là 1' })
  @Max(53, { message: 'week_number tối đa là 53' })
  week_number!: number;

  @ApiProperty({ description: 'Năm', example: 2026 })
  @IsInt({ message: 'year phải là số nguyên' })
  @Min(2000, { message: 'year tối thiểu là 2000' })
  @Max(2100, { message: 'year tối đa là 2100' })
  year!: number;

  @ApiPropertyOptional({
    description: 'Mục tiêu tuần',
    example: 'Hoàn thiện module quản trị tiến độ và chốt API spec',
  })
  @IsString({ message: 'goal phải là chuỗi' })
  @IsOptional()
  goal?: string;

  @ApiPropertyOptional({
    description: 'Mục tiêu tuần (alias goals)',
    example: 'Hoàn thiện module quản trị tiến độ và chốt API spec',
  })
  @IsString({ message: 'goals phải là chuỗi' })
  @IsOptional()
  goals?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kế hoạch',
    enum: WeeklyPlanStatus,
    default: WeeklyPlanStatus.ACTIVE,
  })
  @IsEnum(WeeklyPlanStatus, { message: 'status không hợp lệ' })
  @IsOptional()
  status?: WeeklyPlanStatus;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu tuần (YYYY-MM-DD)', example: '2026-09-21' })
  @IsDateString({}, { message: 'start_date phải đúng định dạng ngày YYYY-MM-DD' })
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc tuần (YYYY-MM-DD)', example: '2026-09-27' })
  @IsDateString({}, { message: 'end_date phải đúng định dạng ngày YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID công việc đưa vào tuần',
    type: [String],
    example: ['b2e3f4a1-8d2a-4428-a5ec-91b427e1f4bb'],
  })
  @IsArray({ message: 'task_ids phải là mảng chuỗi UUID' })
  @IsUUID('4', { each: true, message: 'Mỗi task_id phải là UUID hợp lệ' })
  @IsOptional()
  task_ids?: string[];
}
