import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OmiseService } from '../omise/omise.service';
import { OmiseCharge } from '../omise/omise.types';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class CoinService {
  constructor(
    private prisma: PrismaService,
    private omise: OmiseService,
  ) {}

  async getPackages() {
    return this.prisma.coin_packages.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        coins: true,
        bonus_coins: true,
        price_thb: true,
        original_price: true,
        discount_label: true,
        is_popular: true,
      },
    });
  }

  async getCoinBalance(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        coins: true,
        bonus_coins: true,
      },
    });

    return {
      coins: user?.coins ?? 0,
      bonus_coins: user?.bonus_coins ?? 0,
      total: (user?.coins ?? 0) + (user?.bonus_coins ?? 0),
    };
  }

  async getCoinHistory(userId: string) {
    return this.prisma.coin_transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        amount: true,
        bonus_amount: true,
        balance_after: true,
        note: true,
        created_at: true,
      },
    });
  }

  // Create Payment
  async createPayment(userId: string, dto: CreatePaymentDto) {
    if (dto.package_id) {
      const pkg = await this.prisma.coin_packages.findFirst({
        where: { id: dto.package_id, is_active: true },
      });
      if (!pkg) throw new BadRequestException('Package not found');
    }

    const topup = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.coin_transactions.create({
        data: {
          user_id: userId,
          type: 'topup',
          amount: 0,
          balance_after: 0,
          note: `เติมคอยน์ ${dto.amount} บาท`,
        },
      });

      return tx.coin_topups.create({
        data: {
          transaction_id: transaction.id,
          package_id: dto.package_id ?? null,
          coins_purchased: dto.amount,
          amount_thb: dto.amount,
          payment_method: dto.method,
          status: 'pending',
        },
      });
    });

    let charge: Awaited<ReturnType<typeof this.omise.createPromptPayCharge>>;

    switch (dto.method) {
      case PaymentMethod.PROMPTPAY:
        charge = await this.omise.createPromptPayCharge(dto.amount, topup.id);
        break;

      case PaymentMethod.CREDIT_CARD:
        if (!dto.token) throw new BadRequestException('Card token is required');
        charge = await this.omise.createCardCharge(
          dto.amount,
          dto.token,
          topup.id,
        );
        break;

      case PaymentMethod.TRUEMONEY:
        if (!dto.phone)
          throw new BadRequestException('Phone number is required');
        charge = await this.omise.createTrueMoneyCharge(
          dto.amount,
          dto.phone,
          topup.id,
        );
        break;
    }

    const omiseCharge = charge as OmiseCharge;

    await this.prisma.coin_topups.update({
      where: { id: topup.id },
      data: { payment_ref: omiseCharge.id },
    });

    // 5. return
    return {
      topup_id: topup.id,
      charge_id: omiseCharge.id,
      status: omiseCharge.status,
      authorize_uri: omiseCharge.authorize_uri ?? null,
      qr_code: omiseCharge.source?.scannable_code?.image?.download_uri ?? null,
    };
  }

  async getPaymentStatus(topupId: string, userId: string) {
    const topup = await this.prisma.coin_topups.findFirst({
      where: {
        id: topupId,
        transaction: { user_id: userId },
      },
    });

    if (!topup) throw new BadRequestException('Topup not found');

    return { status: topup.status };
  }

  async handleWebhook(
    body: Record<string, unknown>,
    signature?: string,
    rawBody?: Buffer,
    timestamp?: string,
  ) {
    if (signature && timestamp && rawBody) {
      if (!this.verifyWebhookSignature(rawBody, signature, timestamp)) {
        throw new BadRequestException('Invalid webhook signature');
      }
      console.log('✅ Verified via HMAC');
    } else {
      console.log('⚠️ No signature headers');
    }

    if (body.object !== 'event') {
      console.log('Not an event object, skipping');
      return { received: true };
    }

    const eventKey = body.key as string;
    const charge = body.data as
      | {
          object: string;
          id: string;
          status: string;
          metadata: { order_id: string };
          paid: boolean;
        }
      | undefined;

    console.log('Event key:', eventKey);
    //console.log('Charge id:', charge?.id);

    if (eventKey !== 'charge.complete') {
      return { received: true };
    }

    if (!charge || charge.object !== 'charge') {
      return { received: true };
    }

    let verifiedStatus: string;
    let verifiedOrderId: string | undefined;

    try {
      const verifiedCharge = await this.omise.getCharge(charge.id);
      verifiedStatus = verifiedCharge.status;

      const meta = (verifiedCharge as unknown as Record<string, unknown>)
        .metadata as { order_id?: string } | undefined;
      verifiedOrderId = meta?.order_id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to verify charge:', message);
      throw new BadRequestException('Cannot verify charge');
    }

    // console.log('Verified status:', verifiedStatus);

    if (verifiedStatus === 'failed') {
      if (verifiedOrderId) {
        await this.prisma.coin_topups.update({
          where: { id: verifiedOrderId },
          data: { status: 'failed' },
        });
      }
      return { received: true };
    }

    if (verifiedStatus !== 'successful') {
      return { received: true };
    }

    if (!verifiedOrderId) return { received: true };

    const topup = await this.prisma.coin_topups.findUnique({
      where: { id: verifiedOrderId },
      include: { transaction: true },
    });

    if (!topup) return { received: true };
    if (topup.status !== 'pending') return { received: true };

    await this.prisma.$transaction(async (tx) => {
      const pkg = topup.package_id
        ? await tx.coin_packages.findUnique({
            where: { id: topup.package_id },
          })
        : null;

      const coinsToAdd = pkg?.coins ?? topup.coins_purchased;
      const bonusToAdd = pkg?.bonus_coins ?? 0;

      const user = await tx.users.update({
        where: { user_id: topup.transaction.user_id },
        data: {
          coins: { increment: coinsToAdd },
          bonus_coins: { increment: bonusToAdd },
        },
      });

      await tx.coin_transactions.update({
        where: { id: topup.transaction_id },
        data: {
          amount: coinsToAdd,
          bonus_amount: bonusToAdd,
          balance_after: user.coins,
          bonus_balance_after: user.bonus_coins,
        },
      });

      await tx.coin_topups.update({
        where: { id: topup.id },
        data: { status: 'success', paid_at: new Date() },
      });

      if (bonusToAdd > 0) {
        await tx.coin_bonus_expirations.create({
          data: {
            user_id: topup.transaction.user_id,
            amount: bonusToAdd,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    });

    console.log('✅ Payment processed for topup:', verifiedOrderId);
    return { received: true };
  }

  private verifyWebhookSignature(
    rawBody?: Buffer,
    signature?: string,
    timestamp?: string,
  ): boolean {
    if (process.env.NODE_ENV !== 'production') return true;
    if (!rawBody || !signature || !timestamp) return false;

    const secret = process.env.OMISE_WEBHOOK_SECRET;
    if (!secret) return false;

    const secretBuffer = Buffer.from(secret, 'base64');
    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;

    const expectedBuffer = crypto
      .createHmac('sha256', secretBuffer)
      .update(signedPayload)
      .digest();

    const signatures = signature.split(',');
    for (const sig of signatures) {
      const sigBuffer = Buffer.from(sig, 'hex');
      if (
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        return true;
      }
    }

    return false;
  }
}
