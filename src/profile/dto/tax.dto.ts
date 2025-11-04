import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaxInfoDto {
  @ApiPropertyOptional({ example: '123-45-6789' })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiPropertyOptional({ example: 'single' })
  @IsOptional()
  @IsString()
  filingStatus?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  annualIncome?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  dependents?: number;

  @ApiPropertyOptional({ example: 'ABC Corporation' })
  @IsOptional()
  @IsString()
  employer?: string;
}

export class TaxInfoResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  ssn?: string;

  @ApiPropertyOptional()
  filingStatus?: string;

  @ApiPropertyOptional()
  annualIncome?: number;

  @ApiPropertyOptional()
  dependents?: number;

  @ApiPropertyOptional()
  employer?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
