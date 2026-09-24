import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQuickNoteDto {
  @ApiProperty({
    example: 'Anh Tuấn báo cáo API Payment gateway sẽ trễ 1 ngày do bảo trì sandbox',
    description: 'Nội dung ghi chú nhanh',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung ghi chú không được để trống' })
  content!: string;

  @ApiPropertyOptional({
    example: 'Chậm tiến độ API Payment',
    description: 'Tiêu đề (tùy chọn, nếu bỏ trống sẽ tự trích xuất từ nội dung)',
  })
  @IsString()
  @IsOptional()
  title?: string;
}
