import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AssignMemberDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID thành viên' })
  @IsUUID('all', { message: 'member_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'member_id không được để trống' })
  member_id!: string;

  @ApiProperty({ example: 'Tech Lead / Backend', description: 'Vai trò trong dự án này' })
  @IsString({ message: 'project_role phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'project_role không được để trống' })
  project_role!: string;

  @ApiPropertyOptional({ example: 80, description: 'Tỷ lệ phân bổ thời gian (0 - 100%)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  allocation_percent?: number;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Ngày tham gia dự án (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  joined_at?: string;
}
