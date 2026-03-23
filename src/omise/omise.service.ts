import { Injectable, OnModuleInit } from '@nestjs/common';
import Omise from 'omise';

@Injectable()
export class OmiseService implements OnModuleInit {
  private omise!: ReturnType<typeof Omise>;

  onModuleInit() {
    this.omise = Omise({
      secretKey: process.env.OMISE_SECRET_KEY!,
      publicKey: process.env.OMISE_PUBLIC_KEY!,
      omiseVersion: '2019-05-29',
    });
  }

  // PromptPay QR
  async createPromptPayCharge(amount: number, orderId: string) {
    const source = await this.omise.sources.create({
      type: 'promptpay',
      amount: amount * 100, // Omise ใช้ satang (สตางค์)
      currency: 'THB',
    });

    return this.omise.charges.create({
      amount: amount * 100,
      currency: 'THB',
      source: source.id,
      return_uri: `${process.env.FRONTEND_URL}/coin/result?order_id=${orderId}`,
      metadata: { order_id: orderId },
    });
  }

  // Credit/Debit Card (ใช้ token จาก Omise.js frontend)
  async createCardCharge(amount: number, token: string, orderId: string) {
    return this.omise.charges.create({
      amount: amount * 100,
      currency: 'THB',
      card: token,
      return_uri: `${process.env.FRONTEND_URL}/coin/result?order_id=${orderId}`,
      metadata: { order_id: orderId },
    });
  }

  // TrueMoney Wallet
  async createTrueMoneyCharge(amount: number, phone: string, orderId: string) {
    const source = await this.omise.sources.create({
      type: 'truemoney',
      amount: amount * 100,
      currency: 'THB',
      phone_number: phone,
    });

    return this.omise.charges.create({
      amount: amount * 100,
      currency: 'THB',
      source: source.id,
      return_uri: `${process.env.FRONTEND_URL}/coin/result?order_id=${orderId}`,
      metadata: { order_id: orderId },
    });
  }

  // ดึง charge มาเช็ค status
  async getCharge(chargeId: string) {
    return this.omise.charges.retrieve(chargeId);
  }
}
