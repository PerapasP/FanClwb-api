import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class SendGiftDto {
  @ApiProperty({ description: 'Gift type ID from the gift_types catalog' })
  @IsUUID()
  gift_type_id: string;

  @ApiProperty({ description: 'Number of gifts to send', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
