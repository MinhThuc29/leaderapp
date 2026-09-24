import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ example: '2026-12-25', description: 'Ngày thực tế hoàn thành dự án' })
  @IsString()
  @IsOptional()
  completed_date?: string;
}
