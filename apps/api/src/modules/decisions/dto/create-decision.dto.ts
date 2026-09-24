import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DecisionStatus } from '@prisma/client';

export class CreateDecisionDto {
  @ApiProperty({
    example: 'Chuyển đổi kiến trúc sang Monorepo với pnpm workspace',
    description: 'Tiêu đề quyết định quản trị / kỹ thuật',
  })
  @IsString({ message: 'Tiêu đề quyết định phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề quyết định không được để trống' })
  title!: string;

  @ApiPropertyOptional({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID dự án liên kết (nếu quyết định gắn với dự án cụ thể)',
  })
  @IsUUID('4', { message: 'project_id phải là UUID' })
  @IsOptional()
  project_id?: string;

  @ApiProperty({
    example: 'Các packages dùng chung kiểu dữ liệu và thư viện đang bị phân mảnh giữa 3 repo riêng rẽ',
    description: 'Bối cảnh ra quyết định (Context)',
  })
  @IsString({ message: 'Bối cảnh phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Bối cảnh không được để trống' })
  context!: string;

  @ApiProperty({
    example: 'Phương án 1: Tiếp tục multi-repo với private npm. Phương án 2: Chuyển sang Monorepo với Turborepo và pnpm.',
    description: 'Các phương án đã cân nhắc (Options considered)',
  })
  @IsString({ message: 'Các phương án cân nhắc phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Các phương án cân nhắc không được để trống' })
  options_considered!: string;

  @ApiPropertyOptional({
    example: 'Chọn phương án 2: Chuyển sang Monorepo',
    description: 'Quyết định được chọn (Decision / Chosen option)',
  })
  @IsString({ message: 'Quyết định phải là chuỗi ký tự' })
  @IsOptional()
  decision?: string;

  @ApiPropertyOptional({
    example: 'Chọn phương án 2: Chuyển sang Monorepo',
    description: 'Alias cho decision (Chosen Option)',
  })
  @IsString()
  @IsOptional()
  chosen_option?: string;

  @ApiPropertyOptional({
    example: 'Giảm 50% thời gian đồng bộ types, build atomic và dễ dàng bảo trì tooling chung',
    description: 'Lý do lựa chọn (Reason / Rationale)',
  })
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    example: 'Giảm 50% thời gian đồng bộ types, build atomic và dễ dàng bảo trì tooling chung',
    description: 'Alias cho reason (Rationale)',
  })
  @IsString()
  @IsOptional()
  rationale?: string;

  @ApiPropertyOptional({
    example: 'Tốc độ CI/CD tăng gấp đôi, không còn tình trạng lệch version type giữa các module',
    description: 'Kỳ vọng ban đầu (Expected result / Expected outcome)',
  })
  @IsString({ message: 'Kỳ vọng phải là chuỗi ký tự' })
  @IsOptional()
  expected_result?: string;

  @ApiPropertyOptional({
    example: 'Tốc độ CI/CD tăng gấp đôi, không còn tình trạng lệch version type giữa các module',
    description: 'Alias cho expected_result (Expected Outcome)',
  })
  @IsString()
  @IsOptional()
  expected_outcome?: string;

  @ApiPropertyOptional({
    example: '2026-09-24',
    description: 'Ngày ra quyết định (YYYY-MM-DD, mặc định hôm nay)',
  })
  @IsString()
  @IsOptional()
  decision_date?: string;

  @ApiPropertyOptional({
    example: '2026-12-24',
    description: 'Ngày dự kiến đánh giá lại sau 3-6 tháng (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  review_date?: string;

  @ApiPropertyOptional({
    enum: DecisionStatus,
    default: DecisionStatus.DECIDED,
    description: 'Trạng thái quyết định',
  })
  @IsEnum(DecisionStatus)
  @IsOptional()
  status?: DecisionStatus;

  @ApiPropertyOptional({
    example: 'Thực tế triển khai Monorepo hoàn tất sau 2 tuần',
    description: 'Kết quả thực tế sau 3-6 tháng',
  })
  @IsString()
  @IsOptional()
  actual_result?: string;
}
