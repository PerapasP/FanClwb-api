import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateCommentDto {
  @ValidateIf((o: CreateCommentDto) => !o.repost_of_id)
  @IsNotEmpty({ message: 'Content is required when not reposting' })
  @IsString()
  @MaxLength(3000)
  content?: string;

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
