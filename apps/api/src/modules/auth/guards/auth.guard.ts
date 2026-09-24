import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthUser } from '@leaderos/shared-types';
import { AuthenticatedRequest } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ??
        this.configService.get<string>('SESSION_SECRET') ??
        'leaderos-super-secret-jwt-key-2026';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token xác thực không hợp lệ hoặc đã hết hạn');
    }
  }

  private extractToken(request: Request): string | null {
    // 1. Ưu tiên lấy từ HttpOnly Cookie
    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    if (cookies && cookies['access_token']) {
      return cookies['access_token'];
    }

    // 2. Dự phòng lấy từ Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
