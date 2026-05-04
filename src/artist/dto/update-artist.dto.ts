import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
