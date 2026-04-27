/*
  Warnings:

  - The values [love] on the enum `ReactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ArtistAccountType" AS ENUM ('group', 'solo');

-- CreateEnum
CREATE TYPE "FandomRole" AS ENUM ('member', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('fan', 'artist', 'admin');

-- CreateEnum
CREATE TYPE "PostAsType" AS ENUM ('user', 'artist', 'member');

-- AlterEnum
BEGIN;
CREATE TYPE "ReactionType_new" AS ENUM ('like');
ALTER TABLE "public"."post_reactions" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "post_reactions" ALTER COLUMN "type" TYPE "ReactionType_new" USING ("type"::text::"ReactionType_new");
ALTER TYPE "ReactionType" RENAME TO "ReactionType_old";
ALTER TYPE "ReactionType_new" RENAME TO "ReactionType";
DROP TYPE "public"."ReactionType_old";
ALTER TABLE "post_reactions" ALTER COLUMN "type" SET DEFAULT 'like';
COMMIT;

-- AlterTable
ALTER TABLE "post_reactions" ALTER COLUMN "type" SET DEFAULT 'like';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "fandom_id" UUID,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "post_as_id" UUID,
ADD COLUMN     "post_as_type" "PostAsType" NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'fan';

-- CreateTable
CREATE TABLE "artist_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "ArtistAccountType" NOT NULL,
    "artist_id" UUID,
    "member_id" UUID,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "artist_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fandoms" (
    "fandom_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "fandoms_pkey" PRIMARY KEY ("fandom_id")
);

-- CreateTable
CREATE TABLE "fandom_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fandom_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "FandomRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "fandom_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_accounts_user_id_key" ON "artist_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_accounts_artist_id_key" ON "artist_accounts"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_accounts_member_id_key" ON "artist_accounts"("member_id");

-- CreateIndex
CREATE INDEX "artist_accounts_artist_id_idx" ON "artist_accounts"("artist_id");

-- CreateIndex
CREATE INDEX "artist_accounts_member_id_idx" ON "artist_accounts"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "fandoms_artist_id_key" ON "fandoms"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "fandoms_slug_key" ON "fandoms"("slug");

-- CreateIndex
CREATE INDEX "fandoms_is_active_idx" ON "fandoms"("is_active");

-- CreateIndex
CREATE INDEX "fandom_members_fandom_id_role_idx" ON "fandom_members"("fandom_id", "role");

-- CreateIndex
CREATE INDEX "fandom_members_user_id_idx" ON "fandom_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "fandom_members_fandom_id_user_id_key" ON "fandom_members"("fandom_id", "user_id");

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "artist_members"("member_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandoms" ADD CONSTRAINT "fandoms_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandom_members" ADD CONSTRAINT "fandom_members_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandom_members" ADD CONSTRAINT "fandom_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE SET NULL ON UPDATE CASCADE;
