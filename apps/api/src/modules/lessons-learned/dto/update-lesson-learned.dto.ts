import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLessonLearnedDto {
  @ApiPropertyOptional({
    example: 'Xử lý sự cố Database Deadlock',
    description: 'Tiêu đề bài học kinh nghiệm',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Hoàn cảnh / Bối cảnh diễn ra (Situation)',
  })
  @IsString()
  @IsOptional()
  situation?: string;

  @ApiPropertyOptional({
    description: 'Bối cảnh (Alias cho situation)',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({
    description: 'Vấn đề gặp phải (Problem)',
  })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({
    description: 'Nguyên nhân gốc rễ (Root Cause)',
  })
  @IsString()
  @IsOptional()
  root_cause?: string;

  @ApiPropertyOptional({
    description: 'Bài học rút ra (Lesson)',
  })
  @IsString()
  @IsOptional()
  lesson?: string;

  @ApiPropertyOptional({
    description: 'Hành động tương lai (Future Action)',
  })
  @IsString()
  @IsOptional()
  future_action?: string;

  @ApiPropertyOptional({
    description: 'ID dự án liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({
    description: 'ID sự cố liên quan',
  })
  @IsUUID('4')
  @IsOptional()
  incident_id?: string | null;

  @ApiPropertyOptional({
    example: ['database', 'deadlock'],
    description: 'Danh sách nhãn (tags) của bài học',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
