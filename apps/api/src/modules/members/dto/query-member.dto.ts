import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryMemberDto {
  @ApiPropertyOptional({ example: 'An', description: 'Từ khóa tìm kiếm theo tên, biệt danh hoặc vai trò' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Lọc theo trạng thái active (true/false)' })
  @IsString()
  @IsOptional()
  active?: string;
}
