import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn Leader', description: 'Họ tên hiển thị' })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  name?: string;

  @ApiPropertyOptional({ example: 'admin@leaderos.local', description: 'Email của Leader' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện (URL hoặc Data URL)' })
  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi ký tự' })
  avatar_url?: string | null;

  @ApiPropertyOptional({ example: 'Engineering Leader', description: 'Chức danh / Vị trí' })
  @IsOptional()
  @IsString({ message: 'Chức danh phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Chức danh không vượt quá 100 ký tự' })
  title?: string | null;

  @ApiPropertyOptional({ example: '+84 987 654 321', description: 'Số điện thoại' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @MaxLength(30, { message: 'Số điện thoại không vượt quá 30 ký tự' })
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'Triết lý kỹ thuật: Đơn giản, bền vững và tự chủ.',
    description: 'Tiểu sử / Triết lý',
  })
  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Tiểu sử không vượt quá 1000 ký tự' })
  bio?: string | null;
}
