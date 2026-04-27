-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

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
