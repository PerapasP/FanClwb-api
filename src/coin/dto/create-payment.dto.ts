import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentMethod {
  PROMPTPAY = 'promptpay',
  CREDIT_CARD = 'credit_card',
  TRUEMONEY = 'truemoney',
}

export class CreatePaymentDto {
  @IsInt()
  @Min(20)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  package_id?: string;
}
