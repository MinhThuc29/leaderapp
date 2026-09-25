import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser, LoginResponse } from '@leaderos/shared-types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản Leader (Lưu session trong HttpOnly Cookie)' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, cookie access_token được đính kèm',
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không chính xác' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { user, token } = await this.authService.login(dto);

    // Lưu token vào HttpOnly Cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất tài khoản Leader (Xóa HttpOnly Cookie)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Đăng xuất thành công' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin Leader hiện tại đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản Leader' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực hoặc token hết hạn' })
  async getProfile(@CurrentUser() user: AuthUser): Promise<{ user: AuthUser }> {
    const freshUser = await this.authService.validateUser(user.id);
    return { user: freshUser };
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân và ảnh đại diện' })
  @ApiResponse({ status: 200, description: 'Cập nhật thông tin thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc email trùng' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ user: AuthUser; message: string }> {
    const updatedUser = await this.authService.updateProfile(user.id, dto);
    return { user: updatedUser, message: 'Cập nhật thông tin cá nhân thành công' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không chính xác' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }
}
