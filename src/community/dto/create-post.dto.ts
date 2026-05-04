import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { type PostAsType } from '@prisma/client';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString()
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsOptional()
  @IsIn(['user', 'artist', 'member'])
  post_as_type?: PostAsType;

  @IsOptional()
  @IsUUID()
  post_as_id?: string;

  @IsOptional()
  @IsUUID()
  fandom_id?: string;

  @IsOptional()
  @IsUUID()
  artist_id?: string;

  @IsOptional()
  @IsBoolean()
  is_exclusive?: boolean;
}
