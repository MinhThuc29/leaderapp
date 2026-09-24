import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewDecisionDto {
  @ApiProperty({
    example: 'Thực tế triển khai Monorepo hoàn tất sau 2 tuần. Tốc độ build CI giảm từ 8 phút xuống 3 phút.',
    description: 'Kết quả thực tế sau 3-6 tháng đánh giá lại (Actual result)',
  })
  @IsString({ message: 'Kết quả thực tế phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Kết quả thực tế không được để trống khi hoàn tất đánh giá' })
  actual_result!: string;

  @ApiPropertyOptional({
    example: 'Cần tài liệu hóa quy trình release package nội bộ cho các bạn junior',
    description: 'Ghi chú thêm hoặc bài học kinh nghiệm',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
