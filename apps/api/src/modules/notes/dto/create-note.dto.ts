import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NoteType } from '@prisma/client';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Kế hoạch triển khai CI/CD pipeline',
    description: 'Tiêu đề ghi chú',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề ghi chú không được để trống' })
  title!: string;

  @ApiProperty({
    example: 'Chi tiết các bước cài đặt GitHub Actions runner...',
    description: 'Nội dung chi tiết của ghi chú',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung ghi chú không được để trống' })
  content!: string;

  @ApiPropertyOptional({
    enum: NoteType,
    example: NoteType.TECHNICAL,
    description: 'Loại ghi chú (WORK, IDEA, TECHNICAL, MEETING, GENERAL)',
    default: NoteType.GENERAL,
  })
  @IsEnum(NoteType, { message: 'Loại ghi chú không hợp lệ' })
  @IsOptional()
  type?: NoteType;

  @ApiPropertyOptional({
    enum: NoteType,
    example: NoteType.TECHNICAL,
    description: 'Danh mục/Loại ghi chú (Alias cho type)',
  })
  @IsEnum(NoteType, { message: 'Danh mục ghi chú không hợp lệ' })
  @IsOptional()
  category?: NoteType;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID dự án liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID thành viên liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Ghim ghi chú lên đầu trang',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_pinned?: boolean;

  @ApiPropertyOptional({
    example: ['architecture', 'backend', 'performance'],
    description: 'Danh sách nhãn (tags) của ghi chú',
    type: [String],
  })
  @IsString({ each: true, message: 'Mỗi nhãn phải là một chuỗi' })
  @IsOptional()
  tags?: string[];
}
