import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLessonLearnedDto {
  @ApiProperty({
    example: 'Xử lý sự cố Database Deadlock khi cập nhật đồng thời nhiều đơn hàng',
    description: 'Tiêu đề bài học kinh nghiệm',
  })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề bài học kinh nghiệm không được để trống' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Trong chiến dịch Flash Sale Black Friday, lượng giao dịch tăng đột biến 1500 req/s...',
    description: 'Hoàn cảnh / Bối cảnh diễn ra (Context / Situation)',
  })
  @IsString()
  @IsOptional()
  situation?: string;

  @ApiPropertyOptional({
    example: 'Trong chiến dịch Flash Sale Black Friday, lượng giao dịch tăng đột biến 1500 req/s...',
    description: 'Bối cảnh (Alias cho situation)',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({
    example: 'Hệ thống liên tục ném lỗi Postgres Deadlock detected, giao dịch thanh toán bị rollback 15%',
    description: 'Vấn đề gặp phải (Problem)',
  })
  @IsString({ message: 'Vấn đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Vấn đề không được để trống' })
  problem!: string;

  @ApiProperty({
    example: 'Thứ tự khóa dòng bảng Inventory và Order khác nhau giữa 2 luồng Checkout và Auto-cancel',
    description: 'Nguyên nhân gốc rễ (Root Cause)',
  })
  @IsString({ message: 'Nguyên nhân gốc rễ phải là chuỗi' })
  @IsNotEmpty({ message: 'Nguyên nhân gốc rễ không được để trống' })
  root_cause!: string;

  @ApiProperty({
    example: 'Cần chuẩn hóa thứ tự Acquire Lock theo ID tăng dần khi cập nhật nhiều bản ghi trong cùng transaction',
    description: 'Bài học rút ra (Lesson)',
  })
  @IsString({ message: 'Bài học rút ra phải là chuỗi' })
  @IsNotEmpty({ message: 'Bài học rút ra không được để trống' })
  lesson!: string;

  @ApiProperty({
    example: 'Đưa rule Sort IDs trước khi Update vào Architecture Guideline và viết unit test kiểm tra lock order',
    description: 'Hành động tương lai (Future Action)',
  })
  @IsString({ message: 'Hành động tương lai phải là chuỗi' })
  @IsNotEmpty({ message: 'Hành động tương lai không được để trống' })
  future_action!: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID dự án liên quan (tùy chọn)',
  })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID sự cố liên quan (nếu convert từ incident)',
  })
  @IsUUID('4')
  @IsOptional()
  incident_id?: string;

  @ApiPropertyOptional({
    example: ['database', 'deadlock', 'concurrency'],
    description: 'Danh sách nhãn (tags) của bài học',
    type: [String],
  })
  @IsString({ each: true, message: 'Mỗi nhãn phải là chuỗi' })
  @IsOptional()
  tags?: string[];
}
