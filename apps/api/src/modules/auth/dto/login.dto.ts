import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@leaderos.local',
    description: 'Email đăng nhập của Leader',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @ApiProperty({
    example: 'LeaderOS@2026!',
    description: 'Mật khẩu tài khoản Leader',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string;
}
