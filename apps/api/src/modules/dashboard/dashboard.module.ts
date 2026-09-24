import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeeklyPlansModule } from '../weekly-plans/weekly-plans.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { NeedAttentionService } from './need-attention.service';

@Module({
  imports: [AuthModule, PrismaModule, WeeklyPlansModule],
  controllers: [DashboardController],
  providers: [DashboardService, NeedAttentionService],
  exports: [DashboardService, NeedAttentionService],
})
export class DashboardModule {}
