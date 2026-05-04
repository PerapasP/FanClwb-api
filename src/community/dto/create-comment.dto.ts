import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString()
  @MaxLength(3000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsUUID()
  parent_id?: string;
  @IsOptional()
  @IsUUID()
  repost_of_id?: string;
}
