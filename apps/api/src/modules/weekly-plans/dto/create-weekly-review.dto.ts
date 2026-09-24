import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateWeeklyReviewInput } from '@leaderos/shared-types';

export class CreateWeeklyReviewDto implements CreateWeeklyReviewInput {
  @ApiProperty({
    description: 'Nhận định tổng quan của Leader về kết quả tuần',
    example: 'Tuần này team hoàn thành 8/10 tasks, còn tồn đọng phần tối ưu DB do latency cao.',
  })
  @IsString({ message: 'summary phải là chuỗi' })
  @IsNotEmpty({ message: 'summary không được để trống' })
  summary!: string;

  @ApiPropertyOptional({
    description: 'Thành tựu chính đã đạt được trong tuần',
    example: 'Release thành công bản Alpha cho khách hàng test quy trình.',
  })
  @IsString({ message: 'achievements phải là chuỗi' })
  @IsOptional()
  achievements?: string;

  @ApiPropertyOptional({
    description: 'Khó khăn / thách thức gặp phải',
    example: 'Phần tích hợp cổng thanh toán bên thứ ba gặp lỗi kết nối sandbox.',
  })
  @IsString({ message: 'challenges phải là chuỗi' })
  @IsOptional()
  challenges?: string;

  @ApiPropertyOptional({
    description: 'Hành động cải tiến cho tuần tới',
    example: 'Viết thêm integration test cho payment service trước khi đẩy sang staging.',
  })
  @IsString({ message: 'improvements phải là chuỗi' })
  @IsOptional()
  improvements?: string;

  @ApiPropertyOptional({ description: 'Số lượng task dự kiến ban đầu', example: 10 })
  @IsNumber({}, { message: 'planned phải là số' })
  @IsOptional()
  planned?: number;

  @ApiPropertyOptional({ description: 'Số lượng task đã hoàn thành', example: 8 })
  @IsNumber({}, { message: 'completed phải là số' })
  @IsOptional()
  completed?: number;

  @ApiPropertyOptional({ description: 'Số lượng task bị tắc/block', example: 1 })
  @IsNumber({}, { message: 'blocked phải là số' })
  @IsOptional()
  blocked?: number;

  @ApiPropertyOptional({ description: 'Số lượng task dời sang tuần sau', example: 1 })
  @IsNumber({}, { message: 'carried_over phải là số' })
  @IsOptional()
  carried_over?: number;

  @ApiPropertyOptional({ description: 'Tỉ lệ hoàn thành (%)', example: 80 })
  @IsNumber({}, { message: 'completion_rate phải là số' })
  @IsOptional()
  completion_rate?: number;
}
