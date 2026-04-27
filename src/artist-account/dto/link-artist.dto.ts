import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { type ArtistAccountType } from '@prisma/client';

export class LinkArtistDto {
  @IsUUID()
  user_id!: string;

  @IsIn(['group', 'solo'])
  type!: ArtistAccountType;

  @IsOptional()
  @IsUUID()
  artist_id?: string;

  @IsOptional()
  @IsUUID()
  member_id?: string;
}
