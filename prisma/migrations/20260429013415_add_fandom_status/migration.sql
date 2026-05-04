-- AlterTable
ALTER TABLE "live_streams" ALTER COLUMN "stream_key" SET DEFAULT replace(gen_random_uuid()::text, '-', '');
