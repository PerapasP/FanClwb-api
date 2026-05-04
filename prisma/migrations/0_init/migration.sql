-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ArtistAccountType" AS ENUM ('group', 'solo');

-- CreateEnum
CREATE TYPE "FandomRole" AS ENUM ('member', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('fan', 'artist', 'admin');

-- CreateEnum
CREATE TYPE "PostAsType" AS ENUM ('user', 'artist', 'member');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('like');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('upvote', 'downvote');

-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('google', 'email');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'email');

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('topup', 'spend', 'bonus', 'refund', 'expire');

-- CreateEnum
CREATE TYPE "TopupStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "FandomStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fullname" VARCHAR,
    "email" VARCHAR,
    "image_url" VARCHAR,
    "phone_number" VARCHAR,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "bonus_coins" INTEGER NOT NULL DEFAULT 0,
    "role" "UserRole" NOT NULL DEFAULT 'fan',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "is_verified" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

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

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_id" TEXT NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

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
    "original_price" INTEGER,
    "discount_label" VARCHAR,

    CONSTRAINT "coin_packages_pkey" PRIMARY KEY ("id")
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
    "package_id" UUID,

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

-- CreateTable
CREATE TABLE "artists" (
    "artist_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_category_id" UUID NOT NULL,
    "label_id" UUID NOT NULL,
    "image_url" VARCHAR(255),
    "name" VARCHAR(100),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("artist_id")
);

-- CreateTable
CREATE TABLE "artists_detail" (
    "artist_detail_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "fullname" VARCHAR(100),
    "fullname_eng" VARCHAR(100),
    "nickname" VARCHAR(100),
    "nickname_eng" VARCHAR(100),
    "birth_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "artists_detail_pkey" PRIMARY KEY ("artist_detail_id")
);

-- CreateTable
CREATE TABLE "artist_categories" (
    "artist_category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "artist_categories_pkey" PRIMARY KEY ("artist_category_id")
);

-- CreateTable
CREATE TABLE "labels" (
    "label_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "labels_pkey" PRIMARY KEY ("label_id")
);

-- CreateTable
CREATE TABLE "artist_members" (
    "member_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_eng" VARCHAR(100),
    "nickname" VARCHAR(50),
    "nickname_eng" VARCHAR(50),
    "image_url" VARCHAR(255),
    "birth_date" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "artist_members_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "sns_platforms" (
    "platform_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "base_url" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sns_platforms_pkey" PRIMARY KEY ("platform_id")
);

-- CreateTable
CREATE TABLE "artist_sns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "artist_sns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_sns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_sns_pkey" PRIMARY KEY ("id")
);

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
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "slug" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "FandomStatus" NOT NULL DEFAULT 'pending',
    "creator_id" UUID,
    "rules" TEXT,
    "artist_id" UUID,
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

-- CreateTable
CREATE TABLE "artist_followers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "post_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "content" TEXT,
    "post_as_type" "PostAsType" NOT NULL DEFAULT 'user',
    "post_as_id" UUID,
    "fandom_id" UUID,
    "artist_id" UUID,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "post_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'like',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "comment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT,
    "upvote_count" INTEGER NOT NULL DEFAULT 0,
    "downvote_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "comment_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "comment_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "icon_url" VARCHAR(500),
    "coin_value" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "gift_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_streams" (
    "stream_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fandom_id" UUID NOT NULL,
    "host_user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "thumbnail_url" VARCHAR(500),
    "stream_key" VARCHAR(200) NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    "rtmp_url" VARCHAR(500),
    "hls_url" VARCHAR(500),
    "status" "StreamStatus" NOT NULL DEFAULT 'scheduled',
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "peak_viewer_count" INTEGER NOT NULL DEFAULT 0,
    "total_gifts_coins" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("stream_id")
);

-- CreateTable
CREATE TABLE "stream_viewers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stream_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "stream_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stream_messages" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stream_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "stream_gifts" (
    "gift_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stream_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "gift_type_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_coins" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_gifts_pkey" PRIMARY KEY ("gift_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_social_id_key" ON "user_identities"("provider", "social_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_email_key" ON "user_identities"("provider", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_id_key" ON "refresh_tokens"("token_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "coin_packages_is_active_sort_order_idx" ON "coin_packages"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "coin_transactions_user_id_idx" ON "coin_transactions"("user_id");

-- CreateIndex
CREATE INDEX "coin_transactions_type_idx" ON "coin_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "coin_topups_transaction_id_key" ON "coin_topups"("transaction_id");

-- CreateIndex
CREATE INDEX "coin_bonus_expirations_user_id_expires_at_idx" ON "coin_bonus_expirations"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE INDEX "artists_label_id_idx" ON "artists"("label_id");

-- CreateIndex
CREATE INDEX "artists_artist_category_id_idx" ON "artists"("artist_category_id");

-- CreateIndex
CREATE INDEX "artists_status_idx" ON "artists"("status");

-- CreateIndex
CREATE UNIQUE INDEX "artists_detail_artist_id_key" ON "artists_detail"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_categories_slug_key" ON "artist_categories"("slug");

-- CreateIndex
CREATE INDEX "artist_members_artist_id_is_active_idx" ON "artist_members"("artist_id", "is_active");

-- CreateIndex
CREATE INDEX "artist_members_sort_order_idx" ON "artist_members"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "sns_platforms_name_key" ON "sns_platforms"("name");

-- CreateIndex
CREATE INDEX "artist_sns_artist_id_idx" ON "artist_sns"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_sns_artist_id_platform_id_key" ON "artist_sns"("artist_id", "platform_id");

-- CreateIndex
CREATE INDEX "member_sns_member_id_idx" ON "member_sns"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_sns_member_id_platform_id_key" ON "member_sns"("member_id", "platform_id");

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
CREATE UNIQUE INDEX "fandoms_slug_key" ON "fandoms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fandoms_artist_id_key" ON "fandoms"("artist_id");

-- CreateIndex
CREATE INDEX "fandoms_artist_id_idx" ON "fandoms"("artist_id");

-- CreateIndex
CREATE INDEX "fandoms_is_active_idx" ON "fandoms"("is_active");

-- CreateIndex
CREATE INDEX "fandoms_status_idx" ON "fandoms"("status");

-- CreateIndex
CREATE INDEX "fandom_members_fandom_id_role_idx" ON "fandom_members"("fandom_id", "role");

-- CreateIndex
CREATE INDEX "fandom_members_user_id_idx" ON "fandom_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "fandom_members_fandom_id_user_id_key" ON "fandom_members"("fandom_id", "user_id");

-- CreateIndex
CREATE INDEX "artist_followers_artist_id_idx" ON "artist_followers"("artist_id");

-- CreateIndex
CREATE INDEX "artist_followers_user_id_idx" ON "artist_followers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_followers_artist_id_user_id_key" ON "artist_followers"("artist_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "posts_fandom_id_idx" ON "posts"("fandom_id");

-- CreateIndex
CREATE INDEX "posts_artist_id_idx" ON "posts"("artist_id");

-- CreateIndex
CREATE INDEX "posts_is_exclusive_idx" ON "posts"("is_exclusive");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_is_deleted_created_at_idx" ON "posts"("is_deleted", "created_at" DESC);

-- CreateIndex
CREATE INDEX "post_images_post_id_sort_order_idx" ON "post_images"("post_id", "sort_order");

-- CreateIndex
CREATE INDEX "post_reactions_post_id_idx" ON "post_reactions"("post_id");

-- CreateIndex
CREATE INDEX "post_reactions_user_id_idx" ON "post_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_reactions_post_id_user_id_key" ON "post_reactions"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_is_deleted_created_at_idx" ON "post_comments"("post_id", "is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "post_comments_parent_id_idx" ON "post_comments"("parent_id");

-- CreateIndex
CREATE INDEX "post_comments_user_id_idx" ON "post_comments"("user_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_parent_id_idx" ON "post_comments"("post_id", "parent_id");

-- CreateIndex
CREATE INDEX "comment_images_comment_id_sort_order_idx" ON "comment_images"("comment_id", "sort_order");

-- CreateIndex
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes"("comment_id");

-- CreateIndex
CREATE INDEX "comment_votes_user_id_idx" ON "comment_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_votes_comment_id_user_id_key" ON "comment_votes"("comment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_types_name_key" ON "gift_types"("name");

-- CreateIndex
CREATE INDEX "gift_types_is_active_sort_order_idx" ON "gift_types"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "live_streams_stream_key_key" ON "live_streams"("stream_key");

-- CreateIndex
CREATE INDEX "live_streams_fandom_id_status_idx" ON "live_streams"("fandom_id", "status");

-- CreateIndex
CREATE INDEX "live_streams_host_user_id_idx" ON "live_streams"("host_user_id");

-- CreateIndex
CREATE INDEX "live_streams_status_started_at_idx" ON "live_streams"("status", "started_at" DESC);

-- CreateIndex
CREATE INDEX "live_streams_scheduled_at_idx" ON "live_streams"("scheduled_at");

-- CreateIndex
CREATE INDEX "stream_viewers_stream_id_idx" ON "stream_viewers"("stream_id");

-- CreateIndex
CREATE UNIQUE INDEX "stream_viewers_stream_id_user_id_key" ON "stream_viewers"("stream_id", "user_id");

-- CreateIndex
CREATE INDEX "stream_messages_stream_id_created_at_idx" ON "stream_messages"("stream_id", "created_at");

-- CreateIndex
CREATE INDEX "stream_messages_user_id_idx" ON "stream_messages"("user_id");

-- CreateIndex
CREATE INDEX "stream_gifts_stream_id_created_at_idx" ON "stream_gifts"("stream_id", "created_at");

-- CreateIndex
CREATE INDEX "stream_gifts_sender_id_idx" ON "stream_gifts"("sender_id");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_topups" ADD CONSTRAINT "coin_topups_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "coin_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_topups" ADD CONSTRAINT "coin_topups_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "coin_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_bonus_expirations" ADD CONSTRAINT "coin_bonus_expirations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_artist_category_id_fkey" FOREIGN KEY ("artist_category_id") REFERENCES "artist_categories"("artist_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("label_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists_detail" ADD CONSTRAINT "artists_detail_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_sns" ADD CONSTRAINT "artist_sns_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_sns" ADD CONSTRAINT "artist_sns_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "sns_platforms"("platform_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_sns" ADD CONSTRAINT "member_sns_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "artist_members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_sns" ADD CONSTRAINT "member_sns_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "sns_platforms"("platform_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_accounts" ADD CONSTRAINT "artist_accounts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "artist_members"("member_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandoms" ADD CONSTRAINT "fandoms_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandoms" ADD CONSTRAINT "fandoms_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandom_members" ADD CONSTRAINT "fandom_members_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fandom_members" ADD CONSTRAINT "fandom_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_followers" ADD CONSTRAINT "artist_followers_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_followers" ADD CONSTRAINT "artist_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_images" ADD CONSTRAINT "comment_images_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_viewers" ADD CONSTRAINT "stream_viewers_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "live_streams"("stream_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_viewers" ADD CONSTRAINT "stream_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_messages" ADD CONSTRAINT "stream_messages_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "live_streams"("stream_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_messages" ADD CONSTRAINT "stream_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_gifts" ADD CONSTRAINT "stream_gifts_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "live_streams"("stream_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_gifts" ADD CONSTRAINT "stream_gifts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_gifts" ADD CONSTRAINT "stream_gifts_gift_type_id_fkey" FOREIGN KEY ("gift_type_id") REFERENCES "gift_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

