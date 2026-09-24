import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LearningStatus, Priority } from '@prisma/client';

export class CreateLearningItemDto {
  @ApiPropertyOptional({
    example: 'Distributed Systems & Consensus Algorithms (Raft, Paxos)',
    description: 'Chủ đề học tập (Title)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Distributed Systems & Consensus Algorithms (Raft, Paxos)',
    description: 'Chủ đề học tập (Alias cho title)',
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({
    example: 'System Design',
    description: 'Danh mục chủ đề (ví dụ: Architecture, Leadership, Frontend, Backend...)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'Nghiên cứu cơ chế bầu chọn leader và replication log',
    description: 'Mô tả chi tiết',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: Priority,
    default: Priority.MEDIUM,
    description: 'Mức độ ưu tiên',
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    example: 'BACKLOG',
    description: 'Trạng thái học tập: BACKLOG (TO_LEARN), LEARNING (IN_PROGRESS), PAUSED, COMPLETED',
    default: 'BACKLOG',
  })
  @IsString()
  @IsOptional()
  status?: LearningStatus | string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Hạn chót mục tiêu hoàn thành (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  target_date?: string;

  @ApiPropertyOptional({
    example: 'https://raft.github.io/',
    description: 'Đường dẫn tài liệu học tập (resource_url)',
  })
  @IsString()
  @IsOptional()
  resource_url?: string;

  @ApiPropertyOptional({
    example: 'https://raft.github.io/',
    description: 'Đường dẫn tài liệu học tập (Alias cho resource_url)',
  })
  @IsString()
  @IsOptional()
  source_url?: string;

  @ApiPropertyOptional({
    example: 'Đọc paper in Search of an Understandable Consensus Algorithm',
    description: 'Ghi chú thêm',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
