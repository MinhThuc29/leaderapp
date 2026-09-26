import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class CreateMeetingDto {
  @ApiProperty({ example: 'Cuộc họp 1-on-1 với Senior Backend Dev', description: 'Tiêu đề cuộc họp' })
  @IsString({ message: 'Tiêu đề cuộc họp phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề cuộc họp không được để trống' })
  title!: string;

  @ApiPropertyOptional({ example: 'Trao đổi lộ trình & OKR quý 3', description: 'Mô tả chi tiết' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Google Meet', description: 'Địa điểm hoặc nền tảng họp' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-xyz', description: 'Link tham gia cuộc họp' })
  @IsString()
  @IsOptional()
  meeting_url?: string;

  @ApiProperty({ example: '2026-09-26T15:30:00.000Z', description: 'Thời gian bắt đầu' })
  @IsString()
  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  start_time!: string;

  @ApiPropertyOptional({ example: '2026-09-26T16:15:00.000Z', description: 'Thời gian kết thúc' })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiPropertyOptional({ enum: MeetingStatus, default: MeetingStatus.UPCOMING, description: 'Trạng thái cuộc họp' })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @ApiPropertyOptional({ example: '- Rà soát OKR\n- Thảo luận kiến trúc Microservices', description: 'Nội dung chương trình họp (Agenda)' })
  @IsString()
  @IsOptional()
  agenda?: string;

  @ApiPropertyOptional({ example: 'Ghi chú sau họp', description: 'Ghi chú cuộc họp' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID dự án liên kết' })
  @IsUUID('4')
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'ID thành viên họp (1-on-1)' })
  @IsUUID('4')
  @IsOptional()
  member_id?: string;
}
