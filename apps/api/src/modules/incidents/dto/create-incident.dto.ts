import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Severity, IncidentStatus } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID dự án phát sinh sự cố',
  })
  @IsUUID('4', { message: 'project_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'project_id không được để trống' })
  project_id!: string;

  @ApiProperty({
    example: 'Lỗi gián đoạn dịch vụ thanh toán trực tuyến trong giờ cao điểm',
    description: 'Tiêu đề sự cố',
  })
  @IsString({ message: 'Tiêu đề sự cố phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề sự cố không được để trống' })
  title!: string;

  @ApiProperty({
    example: 'Cổng thanh toán báo lỗi timeout 504 liên tục từ 19:30 đến 20:15',
    description: 'Mô tả hiện tượng và phạm vi ảnh hưởng của sự cố',
  })
  @IsString({ message: 'Mô tả sự cố phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mô tả sự cố không được để trống' })
  description!: string;

  @ApiPropertyOptional({
    enum: Severity,
    default: Severity.HIGH,
    description: 'Mức độ nghiêm trọng của sự cố',
  })
  @IsEnum(Severity, { message: 'severity không hợp lệ' })
  @IsOptional()
  severity?: Severity;

  @ApiPropertyOptional({
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
    description: 'Trạng thái xử lý sự cố',
  })
  @IsEnum(IncidentStatus, { message: 'status không hợp lệ' })
  @IsOptional()
  status?: IncidentStatus;

  @ApiPropertyOptional({
    example: '2026-09-24T12:30:00.000Z',
    description: 'Thời điểm phát hiện sự cố (ISO string)',
  })
  @IsString()
  @IsOptional()
  detected_at?: string;

  @ApiPropertyOptional({
    example: '2026-09-24T13:45:00.000Z',
    description: 'Thời điểm giải quyết xong sự cố (ISO string)',
  })
  @IsString()
  @IsOptional()
  resolved_at?: string;

  @ApiPropertyOptional({
    example: 'Hết connection pool trong database do thiếu index ở bảng đơn hàng',
    description: 'Nguyên nhân gốc rễ (Root cause)',
  })
  @IsString()
  @IsOptional()
  root_cause?: string;

  @ApiPropertyOptional({
    example: 'Khởi động lại connection pool và tăng max_connections tạm thời',
    description: 'Biện pháp khắc phục đã thực hiện (Solution / Action taken)',
  })
  @IsString()
  @IsOptional()
  solution?: string;

  @ApiPropertyOptional({
    example: 'Khởi động lại connection pool và tăng max_connections tạm thời',
    description: 'Alias cho solution (Action Taken)',
  })
  @IsString()
  @IsOptional()
  action_taken?: string;

  @ApiPropertyOptional({
    example: 'Thêm chỉ mục composite và cấu hình alerting khi connection vượt quá 80%',
    description: 'Biện pháp phòng ngừa tái diễn (Prevention)',
  })
  @IsString()
  @IsOptional()
  prevention?: string;
}
