import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LessonsLearnedService } from './lessons-learned.service';
import { LessonsLearnedController } from './lessons-learned.controller';

@Module({
  imports: [AuthModule],
  controllers: [LessonsLearnedController],
  providers: [LessonsLearnedService],
  exports: [LessonsLearnedService],
})
export class LessonsLearnedModule {}
