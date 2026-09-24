import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { UpdateWeeklyPlanInput, WeeklyPlanStatus } from '@leaderos/shared-types';

export class UpdateWeeklyPlanDto implements UpdateWeeklyPlanInput {
  @ApiPropertyOptional({
    description: 'Mục tiêu tuần',
    example: 'Cập nhật mục tiêu: Chốt UAT Sprint 3',
  })
  @IsString({ message: 'goal phải là chuỗi' })
  @IsOptional()
  goal?: string;

  @ApiPropertyOptional({
    description: 'Mục tiêu tuần (alias)',
    example: 'Cập nhật mục tiêu: Chốt UAT Sprint 3',
  })
  @IsString({ message: 'goals phải là chuỗi' })
  @IsOptional()
  goals?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kế hoạch',
    enum: WeeklyPlanStatus,
  })
  @IsEnum(WeeklyPlanStatus, { message: 'status không hợp lệ' })
  @IsOptional()
  status?: WeeklyPlanStatus;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (YYYY-MM-DD)', example: '2026-09-21' })
  @IsDateString({}, { message: 'start_date phải đúng định dạng ngày YYYY-MM-DD' })
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (YYYY-MM-DD)', example: '2026-09-27' })
  @IsDateString({}, { message: 'end_date phải đúng định dạng ngày YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;
}
