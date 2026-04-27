import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { LiveStreamService } from './live-stream.service';
import { SendGiftDto } from './dto/send-gift.dto';

interface AuthSocket extends Socket {
  data: {
    userId: string;
    currentStreamId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/live',
})
export class LiveStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveStreamGateway.name);

  constructor(
    private readonly liveStreamService: LiveStreamService,
    private readonly jwtService: JwtService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Connection lifecycle
  // ──────────────────────────────────────────────────────────

  async handleConnection(client: AuthSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Auto-leave any stream the user was in
    if (client.data?.currentStreamId && client.data?.userId) {
      try {
        const count = await this.liveStreamService.leaveStream(
          client.data.currentStreamId,
          client.data.userId,
        );
        this.broadcastViewerCount(client.data.currentStreamId, count);
      } catch {
        // Stream may have ended already
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Client → Server events
  // ──────────────────────────────────────────────────────────

  @SubscribeMessage('join-stream')
  async handleJoinStream(
    @MessageBody() data: { streamId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    try {
      const { streamId } = data;
      const userId = client.data.userId;

      // Leave previous stream if any
      if (client.data.currentStreamId && client.data.currentStreamId !== streamId) {
        await this.handleLeaveStreamInternal(client);
      }

      const viewerCount = await this.liveStreamService.joinStream(streamId, userId);
      client.data.currentStreamId = streamId;

      await client.join(`stream:${streamId}`);
      this.broadcastViewerCount(streamId, viewerCount);

      return { event: 'joined', data: { streamId, viewerCount } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join stream';
      return { event: 'error', data: { message: msg } };
    }
  }

  @SubscribeMessage('leave-stream')
  async handleLeaveStream(
    @MessageBody() data: { streamId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    return this.handleLeaveStreamInternal(client, data.streamId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: { streamId: string; content: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    try {
      const message = await this.liveStreamService.sendMessage(
        data.streamId,
        client.data.userId,
        data.content,
      );

      // Broadcast to everyone in the room (including sender)
      this.server.to(`stream:${data.streamId}`).emit('new-message', {
        streamId: data.streamId,
        message,
      });

      return { event: 'message-sent', data: { message_id: message.message_id } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      return { event: 'error', data: { message: msg } };
    }
  }

  @SubscribeMessage('send-gift')
  async handleSendGift(
    @MessageBody() body: { streamId: string } & SendGiftDto,
    @ConnectedSocket() client: AuthSocket,
  ) {
    try {
      const { streamId, gift_type_id, quantity } = body;
      const dto: SendGiftDto = { gift_type_id, quantity };

      const gift = await this.liveStreamService.sendGift(
        streamId,
        client.data.userId,
        dto,
      );

      // Broadcast gift animation to the whole room
      this.server.to(`stream:${streamId}`).emit('new-gift', {
        streamId,
        gift,
      });

      return { event: 'gift-sent', data: { gift_id: gift.gift_id } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send gift';
      return { event: 'error', data: { message: msg } };
    }
  }

  // ──────────────────────────────────────────────────────────
  // Server → Client broadcasts (called by REST controller)
  // ──────────────────────────────────────────────────────────

  broadcastStreamStarted(streamId: string, hlsUrl: string | null) {
    this.server.to(`stream:${streamId}`).emit('stream-started', {
      streamId,
      status: 'live',
      hls_url: hlsUrl,
    });
  }

  broadcastStreamEnded(streamId: string) {
    this.server.to(`stream:${streamId}`).emit('stream-ended', {
      streamId,
      status: 'ended',
    });
  }

  broadcastViewerCount(streamId: string, count: number) {
    this.server.to(`stream:${streamId}`).emit('viewer-count', {
      streamId,
      count,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────

  private async handleLeaveStreamInternal(
    client: AuthSocket,
    streamId?: string,
  ) {
    const targetStreamId = streamId ?? client.data.currentStreamId;
    if (!targetStreamId) return { event: 'left', data: {} };

    try {
      const count = await this.liveStreamService.leaveStream(
        targetStreamId,
        client.data.userId,
      );
      await client.leave(`stream:${targetStreamId}`);

      if (client.data.currentStreamId === targetStreamId) {
        client.data.currentStreamId = undefined;
      }

      this.broadcastViewerCount(targetStreamId, count);
      return { event: 'left', data: { streamId: targetStreamId } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave stream';
      return { event: 'error', data: { message: msg } };
    }
  }

  private extractToken(client: Socket): string | null {
    // Try Authorization header
    const authHeader = client.handshake.headers?.authorization as
      | string
      | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try handshake auth object (socket.io client.auth)
    const authToken = (client.handshake.auth as Record<string, unknown>)
      ?.token as string | undefined;
    if (authToken) return authToken;

    // Try query param
    const queryToken = client.handshake.query?.token as string | undefined;
    if (queryToken) return queryToken;

    return null;
  }
}
