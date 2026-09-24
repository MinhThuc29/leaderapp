import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { IncidentDto, LessonLearnedDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ConvertIncidentToLessonDto } from './dto/convert-to-lesson.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';

@ApiTags('incidents')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi nhận sự cố mới (Incident)' })
  @ApiResponse({ status: 201, description: 'Ghi nhận sự cố thành công' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sự cố (có bộ lọc dự án, trạng thái, mức độ)' })
  @ApiResponse({ status: 200, description: 'Danh sách sự cố' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: IncidentFilterDto,
  ): Promise<IncidentDto[]> {
    return this.incidentsService.findAll(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sự cố theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết sự cố' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentDto> {
    return this.incidentsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tiến trình khắc phục sự cố (nguyên nhân, giải pháp, phòng ngừa)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.update(userId, id, dto);
  }

  @Post(':id/convert-to-lesson')
  @ApiOperation({ summary: '1-click chuyển sự cố thành Bài học kinh nghiệm (Lesson Learned)' })
  @ApiResponse({ status: 201, description: 'Tạo bài học kinh nghiệm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  async convertToLesson(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertIncidentToLessonDto,
  ): Promise<LessonLearnedDto> {
    return this.incidentsService.convertToLesson(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm sự cố' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; id: string }> {
    return this.incidentsService.remove(userId, id);
  }
}
