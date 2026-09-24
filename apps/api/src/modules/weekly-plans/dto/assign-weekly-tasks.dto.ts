import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { AssignWeeklyTasksInput } from '@leaderos/shared-types';

export class AssignWeeklyTasksDto implements AssignWeeklyTasksInput {
  @ApiProperty({
    description: 'Danh sách ID công việc cần đưa vào kế hoạch tuần',
    type: [String],
    example: ['b2e3f4a1-8d2a-4428-a5ec-91b427e1f4bb'],
  })
  @IsArray({ message: 'task_ids phải là mảng chuỗi UUID' })
  @IsUUID('4', { each: true, message: 'Mỗi phần tử trong task_ids phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'task_ids không được rỗng' })
  task_ids!: string[];
}
