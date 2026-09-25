import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUser } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface LoginResult {
  user: AuthUser;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const secret =
      this.configService.get<string>('JWT_SECRET') ??
      this.configService.get<string>('SESSION_SECRET') ??
      'leaderos-super-secret-jwt-key-2026';

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      title: user.title,
      phone: user.phone,
      bio: user.bio,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };

    return {
      user: authUser,
      token,
    };
  }

  async validateUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản Leader không tồn tại');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      title: user.title,
      phone: user.phone,
      bio: user.bio,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUser> {
    // Nếu đổi email, kiểm tra xem email đã tồn tại ở tài khoản khác chưa
    if (dto.email) {
      const emailLower = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findFirst({
        where: {
          email: emailLower,
          NOT: { id: userId },
        },
      });

      if (existing) {
        throw new BadRequestException('Email này đã được sử dụng bởi tài khoản khác');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase().trim() } : {}),
        ...(dto.avatar_url !== undefined ? { avatar_url: dto.avatar_url } : {}),
        ...(dto.title !== undefined ? { title: dto.title?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio?.trim() || null } : {}),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar_url: updated.avatar_url,
      title: updated.title,
      phone: updated.phone,
      bio: updated.bio,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.new_password, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
      },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
