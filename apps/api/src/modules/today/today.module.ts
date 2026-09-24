import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TodayController } from './today.controller';
import { TodayService } from './today.service';

@Module({
  imports: [AuthModule],
  controllers: [TodayController],
  providers: [TodayService],
  exports: [TodayService],
})
export class TodayModule {}
