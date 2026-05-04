import { IsString, IsOptional, IsNumber, IsDateString, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TierDto } from './create-fan-project.dto';

export class UpdateFanProjectDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  target_amount?: number;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  @IsOptional()
  tiers?: TierDto[];
}
