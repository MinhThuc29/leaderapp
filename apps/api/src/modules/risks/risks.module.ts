import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
