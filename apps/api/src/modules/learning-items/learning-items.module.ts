import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LearningItemsService } from './learning-items.service';
import { LearningItemsController } from './learning-items.controller';

@Module({
  imports: [AuthModule],
  controllers: [LearningItemsController],
  providers: [LearningItemsService],
  exports: [LearningItemsService],
})
export class LearningItemsModule {}
