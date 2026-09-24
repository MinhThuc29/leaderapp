import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConvertIncidentToLessonDto {
  @ApiPropertyOptional({
    example: 'Bài học xử lý cạn kiệt Connection Pool Database',
    description: 'Tiêu đề bài học kinh nghiệm (Mặc định lấy theo tiêu đề sự cố nếu để trống)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Hệ thống chịu tải cao đợt khuyến mãi',
    description: 'Bối cảnh xảy ra (Mặc định lấy từ sự cố)',
  })
  @IsString()
  @IsOptional()
  situation?: string;

  @ApiPropertyOptional({
    example: 'Timeout liên tục trên cổng thanh toán',
    description: 'Vấn đề thực tế (Mặc định lấy từ mô tả sự cố)',
  })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({
    example: 'Thiếu index dẫn đến query table scan khóa connection kéo dài',
    description: 'Nguyên nhân gốc rễ (Mặc định lấy từ root_cause của sự cố)',
  })
  @IsString()
  @IsOptional()
  root_cause?: string;

  @ApiProperty({
    example: 'Luôn phải có load test và phân tích execution plan cho các query core trước release',
    description: 'Bài học đúc kết được',
  })
  @IsString({ message: 'Bài học rút ra phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Bài học rút ra không được để trống' })
  lesson!: string;

  @ApiProperty({
    example: 'Bổ sung bước kiểm tra Index vào Checklist review PR tầng Repository',
    description: 'Hành động cải tiến tương lai',
  })
  @IsString({ message: 'Hành động tương lai phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Hành động tương lai không được để trống' })
  future_action!: string;

  @ApiPropertyOptional({
    example: ['incident', 'database', 'performance'],
    description: 'Danh sách thẻ nhãn liên quan',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
