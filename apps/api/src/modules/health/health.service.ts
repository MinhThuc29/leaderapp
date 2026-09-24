import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckData } from '@leaderos/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<HealthCheckData> {
    const isDbHealthy = await this.prisma.isHealthy();

    return {
      status: isDbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: isDbHealthy ? 'connected' : 'disconnected',
      environment: this.configService.get<string>('NODE_ENV') ?? 'development',
      version: '0.1.0',
    };
  }
}
