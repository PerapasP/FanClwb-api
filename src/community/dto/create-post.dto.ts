import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { type PostAsType } from '@prisma/client';

export class CreatePostDto {
  @ValidateIf((o: CreatePostDto) => !o.repost_of_id)
  @IsNotEmpty({ message: 'Content is required when not reposting' })
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsUUID()
  repost_of_id?: string;

  @IsOptional()
  @IsIn(['user', 'artist', 'member'])
  post_as_type?: PostAsType;

  @IsOptional()
  @IsUUID()
  post_as_id?: string;

  @IsOptional()
  @IsUUID()
  fandom_id?: string;
}
