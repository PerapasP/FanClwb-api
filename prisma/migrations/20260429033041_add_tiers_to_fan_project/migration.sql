-- AlterTable
ALTER TABLE "fan_projects" ADD COLUMN     "tiers" JSONB;

-- AlterTable
ALTER TABLE "live_streams" ALTER COLUMN "stream_key" SET DEFAULT replace(gen_random_uuid()::text, '-', '');
