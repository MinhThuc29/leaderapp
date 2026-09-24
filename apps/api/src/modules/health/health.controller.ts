import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckData } from '@leaderos/shared-types';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái hệ thống và kết nối cơ sở dữ liệu' })
  @ApiResponse({
    status: 200,
    description: 'Hệ thống hoạt động bình thường',
    schema: {
      example: {
        data: {
          status: 'ok',
          timestamp: '2026-09-22T08:00:00.000Z',
          uptime: 120,
          database: 'connected',
          environment: 'development',
          version: '0.1.0',
        },
        meta: {
          timestamp: '2026-09-22T08:00:00.000Z',
          path: '/api/v1/health',
        },
      },
    },
  })
  async getHealth(): Promise<HealthCheckData> {
    return this.healthService.check();
  }
}
