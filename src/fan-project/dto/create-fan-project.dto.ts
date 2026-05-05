import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class TierDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateFanProjectDto {
  @IsUUID()
  @IsNotEmpty()
  fandom_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsNumber()
  @Min(1)
  target_amount: number;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  @IsOptional()
  tiers?: TierDto[];
}
