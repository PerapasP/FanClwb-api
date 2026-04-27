/*
  Warnings:

  - You are about to drop the column `auth_provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `social_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('google', 'email');

-- DropIndex
DROP INDEX "users_social_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth_provider",
DROP COLUMN "password",
DROP COLUMN "social_id";

-- CreateTable
CREATE TABLE "user_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "social_id" VARCHAR,
    "email" VARCHAR,
    "password" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_social_id_key" ON "user_identities"("provider", "social_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_email_key" ON "user_identities"("provider", "email");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
