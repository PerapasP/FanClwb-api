-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "live_streams" ALTER COLUMN "stream_key" SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- CreateTable
CREATE TABLE "fan_projects" (
    "project_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fandom_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "target_amount" INTEGER NOT NULL,
    "current_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "fan_projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "fan_project_donations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_project_donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fan_projects_fandom_id_idx" ON "fan_projects"("fandom_id");

-- CreateIndex
CREATE INDEX "fan_projects_status_idx" ON "fan_projects"("status");

-- CreateIndex
CREATE INDEX "fan_project_donations_project_id_idx" ON "fan_project_donations"("project_id");

-- CreateIndex
CREATE INDEX "fan_project_donations_user_id_idx" ON "fan_project_donations"("user_id");

-- AddForeignKey
ALTER TABLE "fan_projects" ADD CONSTRAINT "fan_projects_fandom_id_fkey" FOREIGN KEY ("fandom_id") REFERENCES "fandoms"("fandom_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_projects" ADD CONSTRAINT "fan_projects_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_project_donations" ADD CONSTRAINT "fan_project_donations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "fan_projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_project_donations" ADD CONSTRAINT "fan_project_donations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
