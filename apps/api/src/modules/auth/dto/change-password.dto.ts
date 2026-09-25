import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  current_password!: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  new_password!: string;
}
