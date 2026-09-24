import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NoteType } from '@prisma/client';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    example: 'Cập nhật kế hoạch CI/CD',
    description: 'Tiêu đề ghi chú',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Nội dung cập nhật mới...',
    description: 'Nội dung ghi chú',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    enum: NoteType,
    example: NoteType.WORK,
    description: 'Loại ghi chú',
  })
  @IsEnum(NoteType, { message: 'Loại ghi chú không hợp lệ' })
  @IsOptional()
  type?: NoteType;

  @ApiPropertyOptional({
    enum: NoteType,
    example: NoteType.WORK,
    description: 'Danh mục/Loại ghi chú (Alias cho type)',
  })
  @IsEnum(NoteType, { message: 'Loại ghi chú không hợp lệ' })
  @IsOptional()
  category?: NoteType;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID dự án liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID thành viên liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  member_id?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Ghim ghi chú lên đầu trang',
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
