import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinService } from './coin.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('coin')
export class CoinController {
  constructor(private coinService: CoinService) {}

  // GET /coin/packages
  @Get('packages')
  async getPackages() {
    return this.coinService.getPackages();
  }

  // POST /coin/payment
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('payment')
  async createPayment(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.coinService.createPayment(req.user.userId, dto);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('omise-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.coinService.handleWebhook(body, signature, req.rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment/:topupId/status')
  async getPaymentStatus(
    @Param('topupId') topupId: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.coinService.getPaymentStatus(topupId, req.user.userId);
  }
}
