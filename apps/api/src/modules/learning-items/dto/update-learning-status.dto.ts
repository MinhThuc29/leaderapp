import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLearningStatusDto {
  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Trạng thái học tập: BACKLOG/TO_LEARN, LEARNING/IN_PROGRESS, PAUSED, COMPLETED',
  })
  @IsString()
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status!: string;
}
