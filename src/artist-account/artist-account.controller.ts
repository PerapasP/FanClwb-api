import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ArtistAccountService } from './artist-account.service';
import { LinkArtistDto } from './dto/link-artist.dto';
import { type AuthenticatedRequest } from '@/auth/interfaces/auth.interface';

@Controller('artist-accounts')
@UseGuards(JwtAuthGuard)
export class ArtistAccountController {
  constructor(private readonly artistAccountService: ArtistAccountService) {}

  // ADMIN: เชื่อม user กับ artist
  @Post('link')
  @UseGuards(RolesGuard)
  @Roles('admin')
  link(@Body() dto: LinkArtistDto) {
    return this.artistAccountService.link(dto);
  }

  // ADMIN: ยกเลิกการเชื่อม
  @Delete('unlink/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  unlink(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.artistAccountService.unlink(userId);
  }

  // USER: ดู artist account ของตัวเอง
  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.artistAccountService.findByUser(req.user.user_id);
  }
}
