import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LessonLearnedDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LessonsLearnedService } from './lessons-learned.service';
import { CreateLessonLearnedDto } from './dto/create-lesson-learned.dto';
import { UpdateLessonLearnedDto } from './dto/update-lesson-learned.dto';
import { QueryLessonLearnedDto } from './dto/query-lesson-learned.dto';

@ApiTags('Lessons Learned')
@UseGuards(AuthGuard)
@Controller('lessons-learned')
export class LessonsLearnedController {
  constructor(private readonly lessonsLearnedService: LessonsLearnedService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bài học kinh nghiệm mới (5 bước chuẩn)' })
  @ApiResponse({ status: 201, description: 'Tạo bài học kinh nghiệm thành công' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLessonLearnedDto,
  ): Promise<LessonLearnedDto> {
    return this.lessonsLearnedService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học kinh nghiệm' })
  @ApiResponse({ status: 200, description: 'Danh sách bài học kinh nghiệm' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryLessonLearnedDto,
  ): Promise<LessonLearnedDto[]> {
    return this.lessonsLearnedService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bài học kinh nghiệm' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài học' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LessonLearnedDto> {
    return this.lessonsLearnedService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài học kinh nghiệm' })
  @ApiResponse({ status: 200, description: 'Cập nhật bài học thành công' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonLearnedDto,
  ): Promise<LessonLearnedDto> {
    return this.lessonsLearnedService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm bài học kinh nghiệm' })
  @ApiResponse({ status: 200, description: 'Xóa bài học thành công' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.lessonsLearnedService.remove(userId, id);
  }
}
