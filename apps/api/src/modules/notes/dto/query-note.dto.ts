import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NoteType } from '@prisma/client';

export class QueryNoteDto {
  @ApiPropertyOptional({
    enum: NoteType,
    description: 'Lọc theo loại ghi chú',
  })
  @IsEnum(NoteType)
  @IsOptional()
  type?: NoteType;

  @ApiPropertyOptional({
    enum: NoteType,
    description: 'Lọc theo danh mục/loại ghi chú (Alias cho type)',
  })
  @IsEnum(NoteType)
  @IsOptional()
  category?: NoteType;

  @ApiPropertyOptional({
    description: 'Lọc theo nguồn gốc (QUICK, NORMAL)',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID thành viên' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo tên nhãn (tag)' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề hoặc nội dung' })
  @IsString()
  @IsOptional()
  search?: string;
}
