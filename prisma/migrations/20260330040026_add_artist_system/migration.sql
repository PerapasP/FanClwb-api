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
