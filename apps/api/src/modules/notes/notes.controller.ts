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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, NoteDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotesService } from './notes.service';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('quick')
  @ApiOperation({ summary: 'Tạo nhanh ghi chú (Quick Note: chỉ cần content, source=QUICK)' })
  @ApiResponse({ status: 201, description: 'Lưu ghi chú nhanh thành công' })
  async createQuick(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateQuickNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.createQuick(user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ghi chú đầy đủ' })
  @ApiResponse({ status: 201, description: 'Tạo ghi chú thành công' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ghi chú theo bộ lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách ghi chú' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryNoteDto,
  ): Promise<NoteDto[]> {
    return this.notesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một ghi chú' })
  @ApiResponse({ status: 200, description: 'Chi tiết ghi chú' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghi chú' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NoteDto> {
    return this.notesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ghi chú' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghi chú' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa mềm ghi chú' })
  @ApiResponse({ status: 200, description: 'Xóa ghi chú thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghi chú' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.notesService.remove(user.id, id);
  }
}
