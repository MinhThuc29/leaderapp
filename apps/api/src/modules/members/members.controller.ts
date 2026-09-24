import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MemberDto } from '@leaderos/shared-types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@ApiTags('Members')
@UseGuards(AuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thành viên (hỗ trợ lọc active, tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Danh sách thành viên' })
  async findAll(@Query() query: QueryMemberDto): Promise<MemberDto[]> {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một thành viên' })
  @ApiResponse({ status: 200, description: 'Chi tiết thành viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MemberDto> {
    return this.membersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm mới một thành viên vào đội ngũ' })
  @ApiResponse({ status: 201, description: 'Thành viên được tạo thành công' })
  async create(@Body() dto: CreateMemberDto): Promise<MemberDto> {
    return this.membersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thành viên (bao gồm đổi trạng thái active)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberDto> {
    return this.membersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thành viên (Soft delete)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.membersService.remove(id);
  }
}
