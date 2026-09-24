import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Severity, Probability, RiskStatus } from '@prisma/client';

export class CreateRiskDto {
  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID dự án liên kết',
  })
  @IsUUID('4', { message: 'project_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'project_id không được để trống' })
  project_id!: string;

  @ApiProperty({
    example: 'Nguy cơ trễ hạn bàn giao tích hợp thanh toán ngân hàng',
    description: 'Tiêu đề rủi ro',
  })
  @IsString({ message: 'Tiêu đề rủi ro phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề rủi ro không được để trống' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Phía đối tác ngân hàng chưa cấp môi trường Sandbox đúng lịch hẹn',
    description: 'Mô tả chi tiết nguyên nhân và hoàn cảnh rủi ro',
  })
  @IsString({ message: 'Mô tả rủi ro phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: Severity,
    default: Severity.MEDIUM,
    description: 'Mức độ ảnh hưởng (Severity / Impact)',
  })
  @IsEnum(Severity, { message: 'severity không hợp lệ' })
  @IsOptional()
  severity?: Severity;

  @ApiPropertyOptional({
    enum: Severity,
    description: 'Alias cho severity (Impact)',
  })
  @IsEnum(Severity, { message: 'impact không hợp lệ' })
  @IsOptional()
  impact?: Severity;

  @ApiPropertyOptional({
    enum: Probability,
    default: Probability.MEDIUM,
    description: 'Xác suất xảy ra rủi ro (LOW, MEDIUM, HIGH)',
  })
  @IsEnum(Probability, { message: 'probability không hợp lệ' })
  @IsOptional()
  probability?: Probability;

  @ApiPropertyOptional({
    enum: RiskStatus,
    default: RiskStatus.OPEN,
    description: 'Trạng thái rủi ro',
  })
  @IsEnum(RiskStatus, { message: 'status không hợp lệ' })
  @IsOptional()
  status?: RiskStatus;

  @ApiPropertyOptional({
    example: '22222222-2222-2222-2222-222222222222',
    description: 'ID thành viên phụ trách giải pháp xử lý rủi ro',
  })
  @IsUUID('4', { message: 'owner_member_id phải là UUID' })
  @IsOptional()
  owner_member_id?: string;

  @ApiPropertyOptional({
    example: 'Chuẩn bị sẵn mock service để tiếp tục kiểm thử luồng nội bộ',
    description: 'Kế hoạch giảm thiểu rủi ro (Mitigation)',
  })
  @IsString({ message: 'Phương án giảm thiểu phải là chuỗi ký tự' })
  @IsOptional()
  mitigation?: string;

  @ApiPropertyOptional({
    example: 'Chuẩn bị sẵn mock service để tiếp tục kiểm thử luồng nội bộ',
    description: 'Alias cho mitigation (Mitigation Plan)',
  })
  @IsString({ message: 'Phương án giảm thiểu phải là chuỗi ký tự' })
  @IsOptional()
  mitigation_plan?: string;

  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'Hạn chót xử lý rủi ro (YYYY-MM-DD)',
  })
  @IsString({ message: 'due_date phải là chuỗi ngày' })
  @IsOptional()
  due_date?: string;
}
