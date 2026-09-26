import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { MeetingDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@ApiTags('meetings')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các cuộc họp' })
  @ApiResponse({ status: 200, description: 'Danh sách cuộc họp' })
  async findAll(@CurrentUser('id') userId: string): Promise<MeetingDto[]> {
    return this.meetingsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một cuộc họp' })
  @ApiResponse({ status: 200, description: 'Chi tiết cuộc họp' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MeetingDto> {
    return this.meetingsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo cuộc họp mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công cuộc họp' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMeetingDto,
  ): Promise<MeetingDto> {
    return this.meetingsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin cuộc họp' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
  ): Promise<MeetingDto> {
    return this.meetingsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá cuộc họp' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.meetingsService.delete(userId, id);
    return { message: 'Đã xoá cuộc họp thành công' };
  }
}
