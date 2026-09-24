import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.DONE, description: 'Trạng thái mới của công việc' })
  @IsEnum(TaskStatus, { message: 'Trạng thái không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status!: TaskStatus;

  @ApiPropertyOptional({ example: 'Đã hoàn thành và test qua Postman', description: 'Ghi chú thay đổi trạng thái' })
  @IsString()
  @IsOptional()
  note?: string;
}
