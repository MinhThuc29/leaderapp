import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeeklyPlansController } from './weekly-plans.controller';
import { WeeklyPlansService } from './weekly-plans.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WeeklyPlansController],
  providers: [WeeklyPlansService],
  exports: [WeeklyPlansService],
})
export class WeeklyPlansModule {}
