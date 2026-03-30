/*
  Warnings:

  - Added the required column `name` to the `coin_packages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coin_packages" ADD COLUMN     "discount_label" VARCHAR,
ADD COLUMN     "original_price" INTEGER;
