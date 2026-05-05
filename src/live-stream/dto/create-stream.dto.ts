import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateStreamDto {
  @ApiPropertyOptional({ description: 'Fandom ID this stream belongs to. Optional if streaming via Artist/Member account.' })
  @IsOptional()
  @IsUUID()
  fandom_id?: string;

  @ApiProperty({ description: 'Stream title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Stream description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Thumbnail image URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: 'Whether the stream is in portrait orientation (TikTok style)' })
  @IsOptional()
  @IsBoolean()
  is_portrait?: boolean;

  @ApiPropertyOptional({
    description: 'Scheduled start time (ISO 8601)',
    example: '2026-05-01T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({ enum: ['user', 'artist', 'member', 'fandom'], default: 'user' })
  @IsOptional()
  @IsString()
  stream_as_type?: 'user' | 'artist' | 'member' | 'fandom';

  @ApiPropertyOptional({ description: 'ID of the artist/member/fandom if streaming as that type' })
  @IsOptional()
  @IsUUID()
  stream_as_id?: string;
}
