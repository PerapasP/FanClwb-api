import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { LiveStreamService } from './live-stream.service';
import { LiveStreamGateway } from './live-stream.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import { SendGiftDto } from './dto/send-gift.dto';
import { SrsCallbackDto, ReplayReadyDto } from './dto/srs-hook.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

type AuthRequest = Request & { user: { userId: string } };

@ApiTags('Live Streams')
@Controller('live-streams')
export class LiveStreamController {
  private readonly logger = new Logger(LiveStreamController.name);

  constructor(
    private readonly liveStreamService: LiveStreamService,
    private readonly liveStreamGateway: LiveStreamGateway,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Gift Types (catalog) — public
  // ──────────────────────────────────────────────────────────

  @Get('gift-types')
  @ApiOperation({ summary: 'Get available gift types and their coin costs' })
  getGiftTypes() {
    return this.liveStreamService.getGiftTypes();
  }

  // ──────────────────────────────────────────────────────────
  // Stream listing — public
  // ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List only live streams for the public community' })
  listStreams(@Query() query: PaginationQueryDto) {
    return this.liveStreamService.listStreams(query);
  }

  @Get('my-streams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my own streams (Artist only, includes scheduled)' })
  listMyStreams(@Req() req: AuthRequest, @Query() query: PaginationQueryDto) {
    return this.liveStreamService.listMyStreams(req.user.userId, query);
  }

  @Get('fandom/:fandomId')
  @ApiOperation({ summary: 'List streams for a specific fandom' })
  @ApiParam({ name: 'fandomId', description: 'Fandom UUID' })
  listFandomStreams(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.listFandomStreams(fandomId, query);
  }

  @Get(':streamId')
  @ApiOperation({ summary: 'Get a single stream detail' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  getStream(@Param('streamId', ParseUUIDPipe) streamId: string) {
    return this.liveStreamService.getStream(streamId);
  }

  // ──────────────────────────────────────────────────────────
  // Stream management — Artist only
  // ──────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create / schedule a new live stream (Artist only)' })
  createStream(@Req() req: AuthRequest, @Body() dto: CreateStreamDto) {
    return this.liveStreamService.createStream(req.user.userId, dto);
  }

  @Patch(':streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update stream metadata (Artist/host only)' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  updateStream(
    @Req() req: AuthRequest,
    @Param('streamId', ParseUUIDPipe) streamId: string,
    @Body() dto: UpdateStreamDto,
  ) {
    return this.liveStreamService.updateStream(req.user.userId, streamId, dto);
  }

  @Patch(':streamId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Go live — starts the stream (Artist/host only)' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  async startStream(
    @Req() req: AuthRequest,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    const stream = await this.liveStreamService.startStream(req.user.userId, streamId);

    // Notify all WebSocket subscribers that the stream is now live
    this.liveStreamGateway.broadcastStreamStarted(streamId, stream.hls_url);

    return stream;
  }

  @Patch(':streamId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End the live stream (Artist/host only)' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  async endStream(
    @Req() req: AuthRequest,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    const stream = await this.liveStreamService.endStream(req.user.userId, streamId);

    // Notify all WebSocket subscribers
    this.liveStreamGateway.broadcastStreamEnded(streamId);

    return stream;
  }

  @Delete(':streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a scheduled stream (Artist/host only)' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  cancelStream(
    @Req() req: AuthRequest,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    return this.liveStreamService.cancelStream(req.user.userId, streamId);
  }

  // ──────────────────────────────────────────────────────────
  // Chat — authenticated fans
  // ──────────────────────────────────────────────────────────

  @Get(':streamId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated chat history for a stream' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  getMessages(
    @Param('streamId', ParseUUIDPipe) streamId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.getMessages(streamId, query);
  }

  // ──────────────────────────────────────────────────────────
  // Gifts — authenticated fans
  // ──────────────────────────────────────────────────────────

  @Post(':streamId/gift')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a coin gift to the streamer' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  async sendGift(
    @Req() req: AuthRequest,
    @Param('streamId', ParseUUIDPipe) streamId: string,
    @Body() dto: SendGiftDto,
  ) {
    const gift = await this.liveStreamService.sendGift(
      streamId,
      req.user.userId,
      dto,
    );

    // Also broadcast via WebSocket so all viewers see the gift animation
    this.liveStreamGateway.server.to(`stream:${streamId}`).emit('new-gift', {
      streamId,
      gift,
    });

    return gift;
  }

  @Get(':streamId/gifts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gift history for a stream' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  getGifts(
    @Param('streamId', ParseUUIDPipe) streamId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.getGifts(streamId, query);
  }

  @Get(':streamId/gifts/leaderboard')
  @ApiOperation({ summary: 'Get top gift senders for a stream' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  getGiftLeaderboard(@Param('streamId', ParseUUIDPipe) streamId: string) {
    return this.liveStreamService.getGiftLeaderboard(streamId);
  }

  // ──────────────────────────────────────────────────────────
  // SRS Webhooks — called by SRS media server (no JWT)
  // ──────────────────────────────────────────────────────────

  @Post('hooks/on-publish')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async onPublish(@Body() dto: SrsCallbackDto) {
    this.logger.log(`SRS on_publish: stream=${dto.stream} ip=${dto.ip}`);
    const result = await this.liveStreamService.handlePublish(dto.stream, dto.ip);

    // If stream went live, broadcast via WebSocket
    if (result.code === 0) {
      const stream = await this.liveStreamService.getStreamByKey(dto.stream);
      if (stream) {
        this.liveStreamGateway.broadcastStreamStarted(
          stream.stream_id,
          stream.hls_url,
        );
      }
    }

    return result;
  }

  @Post('hooks/on-unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async onUnpublish(@Body() dto: SrsCallbackDto) {
    this.logger.log(`SRS on_unpublish: stream=${dto.stream}`);
    const result = await this.liveStreamService.handleUnpublish(dto.stream);

    // Broadcast stream ended via WebSocket
    if (result.stream_id) {
      this.liveStreamGateway.broadcastStreamEnded(result.stream_id);
    }

    return result;
  }

  @Post('hooks/replay-ready')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async onReplayReady(@Body() dto: ReplayReadyDto) {
    this.logger.log(`Replay ready: key=${dto.stream_key} url=${dto.replay_url}`);
    const stream = await this.liveStreamService.setReplayUrl(
      dto.stream_key,
      dto.replay_url,
    );

    // Notify fans in the room that the replay is now available
    this.liveStreamGateway.broadcastReplayReady(
      stream.stream_id,
      dto.replay_url,
    );

    return stream;
  }

  // ──────────────────────────────────────────────────────────
  // Replays — public VOD listing
  // ──────────────────────────────────────────────────────────

  @Get('replays')
  @ApiOperation({ summary: 'List all available stream replays (VOD)' })
  listReplays(@Query() query: PaginationQueryDto) {
    return this.liveStreamService.listReplays(query);
  }

  @Get('replays/fandom/:fandomId')
  @ApiOperation({ summary: 'List replays for a specific fandom' })
  @ApiParam({ name: 'fandomId', description: 'Fandom UUID' })
  listFandomReplays(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.listFandomReplays(fandomId, query);
  }

  @Get('artist/:artistId')
  @ApiOperation({ summary: 'List live streams for a specific artist' })
  @ApiParam({ name: 'artistId', description: 'Artist UUID' })
  listArtistStreams(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.listArtistStreams(artistId, query);
  }

  @Get('replays/artist/:artistId')
  @ApiOperation({ summary: 'List replays for a specific artist' })
  @ApiParam({ name: 'artistId', description: 'Artist UUID' })
  listArtistReplays(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.liveStreamService.listArtistReplays(artistId, query);
  }
}
