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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { LiveStreamService } from './live-stream.service';
import { LiveStreamGateway } from './live-stream.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import { SendGiftDto } from './dto/send-gift.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

type AuthRequest = Request & { user: { userId: string } };

@ApiTags('Live Streams')
@Controller('live-streams')
export class LiveStreamController {
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
  @ApiOperation({ summary: 'List all live and scheduled streams' })
  listStreams(@Query() query: PaginationQueryDto) {
    return this.liveStreamService.listStreams(query);
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

  @Get(':streamId/gifts/leaderboard')
  @ApiOperation({ summary: 'Get top gift senders for a stream' })
  @ApiParam({ name: 'streamId', description: 'Stream UUID' })
  getGiftLeaderboard(@Param('streamId', ParseUUIDPipe) streamId: string) {
    return this.liveStreamService.getGiftLeaderboard(streamId);
  }
}
