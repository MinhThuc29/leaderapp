import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ example: 75, description: 'Tiến độ thủ công (0 - 100)' })
  @IsInt({ message: 'Tiến độ phải là số nguyên' })
  @Min(0, { message: 'Tiến độ tối thiểu là 0' })
  @Max(100, { message: 'Tiến độ tối đa là 100' })
  manual_progress!: number;

  @ApiPropertyOptional({ example: 'Hoàn thành tích hợp cổng thanh toán', description: 'Ghi chú cập nhật' })
  @IsString()
  @IsOptional()
  note?: string;
}
