import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  UseGuards,
  Req,
  Delete,
  Patch,
  Body,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { GetArtistsQueryDto } from './dto/get-artists-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { OptionalAuthRequest, AuthenticatedRequest } from '../auth/interfaces/auth.interface';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Controller('artists')
export class ArtistController {
  constructor(private artistService: ArtistService) {}

  // GET /artists
  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: GetArtistsQueryDto,
  ) {
    return this.artistService.findAll(query);
  }

  // GET /artists/categories
  @Get('categories')
  findCategories() {
    return this.artistService.findCategories();
  }

  // GET /artists/labels
  @Get('labels')
  findLabels() {
    return this.artistService.findLabels();
  }

  // GET /artists/by-slug/:slug
  @Get('by-slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  findBySlug(@Param('slug') slug: string, @Req() req: OptionalAuthRequest) {
    return this.artistService.findBySlug(slug, req.user?.user_id);
  }

  // GET /artists/me/following
  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  getFollowing(@Req() req: AuthenticatedRequest) {
    return this.artistService.getFollowing(req.user.user_id);
  }

  // GET /artists/members/:memberId
  @Get('members/:memberId')
  findMemberById(@Param('memberId', ParseUUIDPipe) memberId: string) {
    return this.artistService.findMemberById(memberId);
  }

  // GET /artists/:artistId
  @Get(':artistId')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.artistService.findOne(artistId, req.user?.user_id);
  }

  // GET /artists/:artistId/members
  @Get(':artistId/members')
  findMembers(@Param('artistId', ParseUUIDPipe) artistId: string) {
    return this.artistService.findMembers(artistId);
  }

  // GET /artists/:artistId/members/:memberId
  @Get(':artistId/members/:memberId')
  findMember(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.artistService.findMember(artistId, memberId);
  }

  // POST /artists/:artistId/follow
  @Post(':artistId/follow')
  @UseGuards(JwtAuthGuard)
  follow(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.artistService.follow(artistId, req.user.user_id);
  }

  // DELETE /artists/:artistId/unfollow
  @Delete(':artistId/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.artistService.unfollow(artistId, req.user.user_id);
    return { message: 'Unfollowed' };
  }

  // PATCH /artists/:artistId
  @Patch(':artistId')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Body() dto: UpdateArtistDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Ownership check: Only linked artist or admin
    const user = req.user;
    if (user.role !== 'admin') {
      const artistAccount = await this.artistService['prisma'].artist_accounts.findUnique({
        where: { user_id: user.user_id },
      });

      if (!artistAccount || artistAccount.artist_id !== artistId) {
        throw new ForbiddenException('You are not authorized to update this artist profile');
      }
    }

    return this.artistService.update(artistId, dto);
  }
}
