-- AlterTable
ALTER TABLE "coin_topups" ADD COLUMN     "package_id" UUID;

-- CreateTable
CREATE TABLE "coin_packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coins" INTEGER NOT NULL,
    "bonus_coins" INTEGER NOT NULL DEFAULT 0,
    "price_thb" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "coin_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_packages_is_active_sort_order_idx" ON "coin_packages"("is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "coin_topups" ADD CONSTRAINT "coin_topups_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "coin_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
