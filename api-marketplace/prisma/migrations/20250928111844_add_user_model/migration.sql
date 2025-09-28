/*
  Warnings:

  - The values [AI_ML,DATA,FINANCE,SOCIAL,ECOMMERCE,PRODUCTIVITY,DEVELOPER_TOOLS,COMMUNICATION,MULTIMEDIA,LOCATION,WEATHER,NEWS,SPORTS,GAMING,HEALTHCARE,EDUCATION,OTHER] on the enum `api_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'API_CALL');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."api_category_new" AS ENUM ('ai_ml', 'data', 'finance', 'social', 'ecommerce', 'productivity', 'developer_tools', 'communication', 'multimedia', 'location', 'weather', 'news', 'sports', 'gaming', 'healthcare', 'education', 'other');
ALTER TABLE "public"."apis" ALTER COLUMN "category" TYPE "public"."api_category_new" USING ("category"::text::"public"."api_category_new");
ALTER TYPE "public"."api_category" RENAME TO "api_category_old";
ALTER TYPE "public"."api_category_new" RENAME TO "api_category";
DROP TYPE "public"."api_category_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."apis" ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ADD COLUMN     "status" "public"."api_status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."subscriptions" ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."usage" ADD COLUMN     "country" VARCHAR(2),
ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ADD COLUMN     "region" VARCHAR(100),
ADD COLUMN     "request_size" BIGINT,
ADD COLUMN     "response_size" BIGINT;

-- CreateTable
CREATE TABLE "public"."endpoints" (
    "id" UUID NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "method" "public"."http_method" NOT NULL,
    "description" TEXT,
    "parameters" JSONB,
    "responses" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "api_id" UUID NOT NULL,

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endpoints_api_id_idx" ON "public"."endpoints"("api_id");

-- CreateIndex
CREATE UNIQUE INDEX "endpoints_api_id_path_method_key" ON "public"."endpoints"("api_id", "path", "method");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_timestamp_idx" ON "public"."audit_logs"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "public"."audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "api_keys_is_active_expires_at_idx" ON "public"."api_keys"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "apis_slug_idx" ON "public"."apis"("slug");

-- CreateIndex
CREATE INDEX "apis_created_at_idx" ON "public"."apis"("created_at");

-- CreateIndex
CREATE INDEX "apis_rating_idx" ON "public"."apis"("rating");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "public"."refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "reviews_api_id_idx" ON "public"."reviews"("api_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_api_id_idx" ON "public"."subscriptions"("api_id");

-- CreateIndex
CREATE INDEX "subscriptions_is_active_expires_at_idx" ON "public"."subscriptions"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "usage_api_key_id_timestamp_idx" ON "public"."usage"("api_key_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "usage_timestamp_idx" ON "public"."usage"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "usage_status_code_timestamp_idx" ON "public"."usage"("status_code", "timestamp");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "public"."users"("created_at");

-- AddForeignKey
ALTER TABLE "public"."endpoints" ADD CONSTRAINT "endpoints_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
