import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
