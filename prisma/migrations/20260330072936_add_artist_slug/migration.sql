ALTER TABLE "artists" ADD COLUMN "slug" VARCHAR(100);

UPDATE "artists" SET "slug" = LOWER(REPLACE("name", ' ', '-'));

ALTER TABLE "artists" ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "artists" ADD CONSTRAINT "artists_slug_key" UNIQUE ("slug");