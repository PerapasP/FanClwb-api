import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { GetArtistsQueryDto } from './dto/get-artists-query.dto';

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

  // GET /artists/:artistId
  @Get(':artistId')
  findOne(@Param('artistId', ParseUUIDPipe) artistId: string) {
    return this.artistService.findOne(artistId);
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
}
