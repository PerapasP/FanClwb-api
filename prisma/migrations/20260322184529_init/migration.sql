-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('topup', 'spend', 'bonus', 'refund', 'expire');

-- CreateEnum
CREATE TYPE "TopupStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "social_id" VARCHAR NOT NULL,
    "fullname" VARCHAR,
    "email" VARCHAR,
    "phone_number" VARCHAR,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "bonus_coins" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "is_verified" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "bonus_amount" INTEGER NOT NULL DEFAULT 0,
    "balance_after" INTEGER NOT NULL,
    "bonus_balance_after" INTEGER NOT NULL DEFAULT 0,
    "ref_id" VARCHAR,
    "note" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_topups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "coins_purchased" INTEGER NOT NULL,
    "bonus_coins" INTEGER NOT NULL DEFAULT 0,
    "amount_thb" INTEGER NOT NULL,
    "payment_method" VARCHAR,
    "payment_ref" VARCHAR,
    "status" "TopupStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "coin_topups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_bonus_expirations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_bonus_expirations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_social_id_key" ON "users"("social_id");

-- CreateIndex
CREATE INDEX "coin_transactions_user_id_idx" ON "coin_transactions"("user_id");

-- CreateIndex
CREATE INDEX "coin_transactions_type_idx" ON "coin_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "coin_topups_transaction_id_key" ON "coin_topups"("transaction_id");

-- CreateIndex
CREATE INDEX "coin_bonus_expirations_user_id_expires_at_idx" ON "coin_bonus_expirations"("user_id", "expires_at");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_topups" ADD CONSTRAINT "coin_topups_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "coin_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_bonus_expirations" ADD CONSTRAINT "coin_bonus_expirations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
