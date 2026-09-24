import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryLessonLearnedDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID dự án' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo tên nhãn (tag)' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm từ khóa theo tiêu đề, hoàn cảnh, bài học...' })
  @IsString()
  @IsOptional()
  search?: string;
}
