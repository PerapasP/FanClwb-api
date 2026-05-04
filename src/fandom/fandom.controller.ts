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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { FandomService } from './fandom.service';
import { CreateFandomDto } from './dto/create-fandom.dto';
import { UpdateFandomDto } from './dto/update-fandom.dto';
import { ManageMemberDto } from './dto/manage-member.dto';
import { PaginationQueryDto } from '@/community/dto/pagination-query.dto';
import {
  type AuthenticatedRequest,
  type OptionalAuthRequest,
} from '@/auth/interfaces/auth.interface';

@Controller('fandoms')
export class FandomController {
  constructor(private readonly fandomService: FandomService) {}

  // ─── ADMIN: สร้าง fandom ─────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateFandomDto) {
    return this.fandomService.create(dto);
  }

  // ─── USER: ขอสร้าง fandom ───────────────────────────
  @Post('request')
  @UseGuards(JwtAuthGuard)
  requestFandom(
    @Body() dto: CreateFandomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fandomService.create(dto, req.user.user_id);
  }

  // ─── ADMIN: ดูรายการขอสร้าง fandom ──────────────────
  @Get('pending')
  @UseGuards(JwtAuthGuard)
  getPending() {
    return this.fandomService.getPending();
  }

  // ─── ADMIN: อนุมัติ fandom ───────────────────────────
  @Post(':fandomId/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('fandomId', ParseUUIDPipe) fandomId: string) {
    return this.fandomService.approve(fandomId);
  }

  // ─── ADMIN: ปฏิเสธ fandom ───────────────────────────
  @Post(':fandomId/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('fandomId', ParseUUIDPipe) fandomId: string) {
    return this.fandomService.reject(fandomId);
  }

  // ─── PUBLIC: ดู fandom ทั้งหมด ────────────────────────
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.fandomService.findAll(query);
  }

  // ─── USER: ดูแฟนด้อมที่ฉันเป็นสมาชิก ──────────────────────
  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  getMyFandoms(@Req() req: AuthenticatedRequest) {
    return this.fandomService.getMyFandoms(req.user.user_id);
  }

  // ─── PUBLIC: ดู fandom by slug ────────────────────────
  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  findBySlug(@Param('slug') slug: string, @Req() req: OptionalAuthRequest) {
    return this.fandomService.findBySlug(slug, req.user?.user_id);
  }

  // ─── ADMIN/FANDOM ADMIN: แก้ไข fandom ───────────────
  @Patch(':fandomId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Body() dto: UpdateFandomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // ถ้าไม่ใช่ system admin ให้เช็คว่าเป็น fandom admin
    const actorUserId = req.user.role === 'admin' ? undefined : req.user.user_id;
    return this.fandomService.update(fandomId, dto, actorUserId);
  }

  // ─── USER: เข้าร่วม fandom ────────────────────────────
  @Post(':fandomId/join')
  @UseGuards(JwtAuthGuard)
  join(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fandomService.join(fandomId, req.user.user_id);
  }

  // ─── USER: ออกจาก fandom ──────────────────────────────
  @Delete(':fandomId/leave')
  @UseGuards(JwtAuthGuard)
  leave(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fandomService.leave(fandomId, req.user.user_id);
  }

  // ─── PUBLIC: ดูสมาชิก ─────────────────────────────────
  @Get(':fandomId/members')
  getMembers(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.fandomService.getMembers(fandomId, query);
  }

  // ─── MODERATOR+: จัดการ role สมาชิก ────────────────────
  @Patch(':fandomId/members')
  @UseGuards(JwtAuthGuard)
  manageMember(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ManageMemberDto,
  ) {
    return this.fandomService.manageMember(fandomId, req.user.user_id, dto);
  }

  // ─── MODERATOR+: kick สมาชิก ──────────────────────────
  @Delete(':fandomId/members/:userId')
  @UseGuards(JwtAuthGuard)
  kickMember(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fandomService.kickMember(fandomId, req.user.user_id, userId);
  }
}
