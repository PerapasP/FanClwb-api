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

  // Create
  async createPayment(userId: string, dto: CreatePaymentDto) {
    if (dto.package_id) {
      const pkg = await this.prisma.coin_packages.findFirst({
        where: { id: dto.package_id, is_active: true },
      });
      if (!pkg) throw new BadRequestException('Package not found');
    }

    // 2. สร้าง topup record ก่อน (status = pending)
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

    // 4. เก็บ charge id ไว้ใน topup
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

  async handleWebhook(
    body: Record<string, unknown>,
    signature: string,
    rawBody?: Buffer,
  ) {
    // 1. verify signature จาก Omise
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = body as {
      key: string;
      data: {
        id: string;
        status: string;
        metadata: { order_id: string };
      };
    };

    // 2. รับแค่ event charge.complete
    if (event.key !== 'charge.complete') return { received: true };

    const charge = event.data;
    const topupId = charge.metadata?.order_id;

    if (!topupId) return { received: true };

    // 3. ดึง topup record
    const topup = await this.prisma.coin_topups.findUnique({
      where: { id: topupId },
      include: { transaction: true },
    });

    if (!topup) return { received: true };
    if (topup.status !== 'pending') return { received: true }; // ป้องกัน duplicate

    // 4. ถ้าชำระสำเร็จ → อัปเดต coin balance
    if (charge.status === 'successful') {
      await this.prisma.$transaction(async (tx) => {
        // ดึง package ถ้ามี เพื่อเช็ค bonus
        const pkg = topup.package_id
          ? await tx.coin_packages.findUnique({
              where: { id: topup.package_id },
            })
          : null;

        const coinsToAdd = pkg?.coins ?? topup.coins_purchased;
        const bonusToAdd = pkg?.bonus_coins ?? 0;

        // อัปเดต user balance
        const user = await tx.users.update({
          where: { user_id: topup.transaction.user_id },
          data: {
            coins: { increment: coinsToAdd },
            bonus_coins: { increment: bonusToAdd },
          },
        });

        // อัปเดต transaction
        await tx.coin_transactions.update({
          where: { id: topup.transaction_id },
          data: {
            amount: coinsToAdd,
            bonus_amount: bonusToAdd,
            balance_after: user.coins,
            bonus_balance_after: user.bonus_coins,
          },
        });

        // อัปเดต topup status
        await tx.coin_topups.update({
          where: { id: topup.id },
          data: {
            status: 'success',
            paid_at: new Date(),
          },
        });

        // ถ้ามีโบนัส → สร้าง expiration record (หมดอายุ 30 วัน)
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
    }

    // 5. ถ้าชำระล้มเหลว → อัปเดต topup status
    if (charge.status === 'failed') {
      await this.prisma.coin_topups.update({
        where: { id: topupId },
        data: { status: 'failed' },
      });
    }

    return { received: true };
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

  private verifyWebhookSignature(
    rawBody?: Buffer,
    signature?: string,
  ): boolean {
    if (!rawBody || !signature) return false;

    const secret = process.env.OMISE_WEBHOOK_SECRET;
    if (!secret) return false;

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return hmac === signature;
  }
}
