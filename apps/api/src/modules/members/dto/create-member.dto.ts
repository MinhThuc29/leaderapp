import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên thành viên' })
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name!: string;

  @ApiPropertyOptional({ example: 'An', description: 'Tên gọi ngắn / biệt danh' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ example: 'Backend Engineer', description: 'Vai trò chính của thành viên' })
  @IsString({ message: 'Vai trò phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role!: string;

  @ApiPropertyOptional({ example: 'Senior', description: 'Cấp bậc (Junior, Mid, Senior...)' })
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({ example: 'an.nguyen@company.com', description: 'Email liên hệ' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: 'Thành thạo NestJS, PostgreSQL', description: 'Ghi chú của Leader' })
  @IsString()
  @IsOptional()
  notes?: string;
}
