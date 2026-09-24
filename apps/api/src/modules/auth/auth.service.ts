import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUser } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

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
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }
}
