-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."api_category" AS ENUM ('AI_ML', 'DATA', 'FINANCE', 'SOCIAL', 'ECOMMERCE', 'PRODUCTIVITY', 'DEVELOPER_TOOLS', 'COMMUNICATION', 'MULTIMEDIA', 'LOCATION', 'WEATHER', 'NEWS', 'SPORTS', 'GAMING', 'HEALTHCARE', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."http_method" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS');

-- CreateEnum
CREATE TYPE "public"."subscription_plan" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."billing_period" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "company" VARCHAR(255),
    "bio" TEXT,
    "website" VARCHAR(500),
    "avatar" VARCHAR(500),
    "role" "public"."user_role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" VARCHAR(255),
    "reset_token" VARCHAR(255),
    "reset_token_expiry" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apis" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "base_url" VARCHAR(500) NOT NULL,
    "category" "public"."api_category" NOT NULL,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "slug" VARCHAR(255) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tags" VARCHAR(50)[],
    "documentation" TEXT,
    "pricing" JSONB NOT NULL,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_requests" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "apis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "key" VARCHAR(255) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "permissions" VARCHAR(50)[] DEFAULT ARRAY['READ']::VARCHAR(50)[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL,
    "plan_type" "public"."subscription_plan" NOT NULL,
    "billing_period" "public"."billing_period" NOT NULL DEFAULT 'MONTHLY',
    "monthly_limit" INTEGER NOT NULL DEFAULT 1000,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "api_id" UUID NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage" (
    "id" UUID NOT NULL,
    "method" "public"."http_method" NOT NULL,
    "path" VARCHAR(1000) NOT NULL,
    "status_code" SMALLINT NOT NULL,
    "response_time" INTEGER NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" INET,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "api_id" UUID NOT NULL,
    "api_key_id" UUID,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "api_id" UUID NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_email_verified_idx" ON "public"."users"("is_active", "email_verified");

-- CreateIndex
CREATE UNIQUE INDEX "apis_slug_key" ON "public"."apis"("slug");

-- CreateIndex
CREATE INDEX "apis_owner_id_idx" ON "public"."apis"("owner_id");

-- CreateIndex
CREATE INDEX "apis_category_idx" ON "public"."apis"("category");

-- CreateIndex
CREATE INDEX "apis_is_public_is_active_idx" ON "public"."apis"("is_public", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "public"."api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "public"."api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_api_id_key" ON "public"."subscriptions"("user_id", "api_id");

-- CreateIndex
CREATE INDEX "usage_user_id_timestamp_idx" ON "public"."usage"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "usage_api_id_timestamp_idx" ON "public"."usage"("api_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "public"."refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_api_id_key" ON "public"."reviews"("user_id", "api_id");

-- AddForeignKey
ALTER TABLE "public"."apis" ADD CONSTRAINT "apis_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage" ADD CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage" ADD CONSTRAINT "usage_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage" ADD CONSTRAINT "usage_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
