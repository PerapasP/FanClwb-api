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

  // GET /coin/balance
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Req() req: Request & { user: { userId: string } }) {
    return this.coinService.getCoinBalance(req.user.userId);
  }

  // GET /coin/history
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Req() req: Request & { user: { userId: string } }) {
    return this.coinService.getCoinHistory(req.user.userId);
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
    @Headers('omise-signature-timestamp') timestamp: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.coinService.handleWebhook(
      body,
      signature,
      req.rawBody,
      timestamp,
    );
  }

  // @Post('webhook')
  // async handleWebhook(
  //   @Req() req: RawBodyRequest<Request>,
  //   @Body() body: Record<string, unknown>,
  // ) {
  //   console.log('=== WEBHOOK DEBUG ===');
  //   console.log('body.object:', body.object);
  //   console.log('body.key:', body.key);
  //   console.log(
  //     'body.data:',
  //     JSON.stringify(body.data, null, 2).substring(0, 500),
  //   );

  //   const signature = req.headers['omise-signature'] as string;
  //   const timestamp = req.headers['omise-signature-timestamp'] as string;

  //   return this.coinService.handleWebhook(
  //     body,
  //     signature,
  //     req.rawBody,
  //     timestamp,
  //   );
  // }

  @UseGuards(JwtAuthGuard)
  @Get('payment/:topupId/status')
  async getPaymentStatus(
    @Param('topupId') topupId: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.coinService.getPaymentStatus(topupId, req.user.userId);
  }
}
