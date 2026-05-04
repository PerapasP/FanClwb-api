import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class DonateFanProjectDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  message?: string;
}
