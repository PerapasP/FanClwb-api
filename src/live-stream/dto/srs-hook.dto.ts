import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

/**
 * SRS on_publish / on_unpublish webhook payload.
 * SRS sends these when a streamer connects/disconnects via RTMP.
 * Docs: https://ossrs.io/lts/en-us/docs/v5/doc/http-callback
 */
export class SrsCallbackDto {
  @ApiProperty({ description: 'Hook action', example: 'on_publish' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'SRS client ID' })
  @IsString()
  client_id: string;

  @ApiProperty({ description: 'Client IP address' })
  @IsString()
  ip: string;

  @ApiProperty({ description: 'Virtual host', example: '__defaultVhost__' })
  @IsString()
  vhost: string;

  @ApiProperty({ description: 'Application name', example: 'live' })
  @IsString()
  app: string;

  @ApiProperty({
    description: 'Stream name (= stream_key)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  stream: string;

  @IsOptional()
  @IsString()
  server_id?: string;

  @IsOptional()
  @IsString()
  service_id?: string;

  @IsOptional()
  @IsString()
  tcUrl?: string;

  @IsOptional()
  @IsString()
  stream_url?: string;

  @IsOptional()
  @IsString()
  stream_id?: string;

  @ApiPropertyOptional({ description: 'Query parameters from RTMP URL' })
  @IsOptional()
  @IsString()
  param?: string;
}

/**
 * Payload sent by the converter service when an FLV → MP4 conversion completes.
 */
export class ReplayReadyDto {
  @ApiProperty({
    description: 'The stream_key that was recorded',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  stream_key: string;

  @ApiProperty({
    description: 'Final replay URL (MP4)',
    example: 'https://stream.fanclwb.site/recordings/a1b2c3d4.mp4',
  })
  @IsString()
  replay_url: string;
}
