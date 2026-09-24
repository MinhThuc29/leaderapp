import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // Middleware cookie-parser để giải mã HttpOnly Cookie
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // Global Interceptors & Filters & Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Documentation at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LeaderOS API')
    .setDescription('Hệ điều hành quản trị cá nhân cho Engineering Leader - REST API Documentation')
    .setVersion('0.1.0')
    .addTag('Health', 'Endpoint kiểm tra sức khỏe hệ thống')
    .addTag('Auth', 'Module xác thực tài khoản Leader (HttpOnly Cookie)')
    .addTag('Members', 'Quản lý thành viên nhóm (Member != User)')
    .addTag('Projects', 'Quản lý dự án, tiến độ và phân công thành viên')
    .addTag('Milestones', 'Quản lý các cột mốc dự án')
    .addTag('Tasks', 'Quản lý công việc, lịch sử trạng thái và tự động tính tiến độ')
    .addTag('Today', 'Tổng hợp dữ liệu màn hình My Day (Tasks, Follow-ups, Notes)')
    .addTag('Follow-ups', 'Quản lý các hạng mục đang chờ phản hồi')
    .addTag('Notes', 'Quản lý ghi chú chuyên sâu và luồng Quick Note')
    .addTag('Lessons Learned', 'Quản lý bài học kinh nghiệm theo chuẩn cấu trúc 5 bước')
    .addTag('Learning Items', 'Quản lý danh sách chủ đề học tập cá nhân')
    .addTag('Weekly Plans', 'Quản lý kế hoạch tuần và kết quả đánh giá (Weekly Reviews)')
    .addTag('Dashboard', 'Bảng điều khiển trung tâm và động cơ cảnh báo Need Attention Engine')
    .addTag('risks', 'Quản trị rủi ro dự án và Ma trận Probability x Impact')
    .addTag('incidents', 'Quản lý sự cố và chuyển đổi thành bài học kinh nghiệm')
    .addTag('decisions', 'Nhật ký quyết định quản trị và đánh giá lại kết quả sau 3-6 tháng')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`LeaderOS API đang chạy tại: http://localhost:${port}/api/v1`);
  logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
