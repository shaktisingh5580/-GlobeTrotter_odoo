-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "trip_status" AS ENUM ('draft', 'planned', 'ongoing', 'completed');

-- CreateEnum
CREATE TYPE "section_type" AS ENUM ('travel', 'stay', 'activity', 'food', 'transport', 'custom');

-- CreateEnum
CREATE TYPE "activity_category" AS ENUM ('sightseeing', 'food', 'adventure', 'culture', 'nightlife', 'shopping', 'nature', 'other');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('transport', 'stay', 'activities', 'meals', 'other');

-- CreateEnum
CREATE TYPE "share_visibility" AS ENUM ('public', 'link_only');

-- CreateEnum
CREATE TYPE "post_visibility" AS ENUM ('public', 'private', 'friends');

-- CreateEnum
CREATE TYPE "reaction_type" AS ENUM ('like', 'love', 'inspire', 'helpful');

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "checksum" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "phone" VARCHAR(20),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "avatar_file_id" UUID,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "role" "user_role" NOT NULL DEFAULT 'user',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "budget_limit" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "cover_file_id" UUID,
    "status" "trip_status" NOT NULL DEFAULT 'draft',
    "copied_from_trip_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "country_code" VARCHAR(3),
    "region" VARCHAR(100),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "timezone" VARCHAR(50),
    "description" TEXT,
    "image_url" TEXT,
    "cost_index" INTEGER,
    "popularity_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "arrival_date" DATE NOT NULL,
    "departure_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_sections" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "trip_stop_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "section_type" "section_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "planned_budget" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "section_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "trip_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" "activity_category",
    "estimated_cost" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "duration_minutes" INTEGER,
    "image_url" TEXT,
    "rating" DECIMAL(2,1),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_items" (
    "id" UUID NOT NULL,
    "trip_stop_id" UUID NOT NULL,
    "trip_section_id" UUID,
    "activity_id" UUID,
    "item_date" DATE NOT NULL,
    "start_time" VARCHAR(10),
    "end_time" VARCHAR(10),
    "item_order" INTEGER NOT NULL,
    "custom_title" VARCHAR(300),
    "custom_description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "trip_stop_id" UUID,
    "trip_section_id" UUID,
    "itinerary_item_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "category" "expense_category" NOT NULL,
    "expense_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_trips" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "share_token" VARCHAR(16) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "share_visibility" NOT NULL DEFAULT 'link_only',
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_destinations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trip_id" UUID,
    "destination_id" UUID,
    "activity_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "post_visibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reactions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reaction_type" "reaction_type" NOT NULL DEFAULT 'like',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_media" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "media_file_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family_id" UUID NOT NULL,
    "device_info" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "replaced_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID,
    "request_id" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_files_storage_key_key" ON "media_files"("storage_key");

-- CreateIndex
CREATE INDEX "idx_media_files_owner" ON "media_files"("owner_user_id");

-- CreateIndex
CREATE INDEX "idx_media_files_storage_key" ON "media_files"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_trips_user_id" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "idx_trips_status" ON "trips"("status");

-- CreateIndex
CREATE INDEX "idx_trips_start_date" ON "trips"("start_date");

-- CreateIndex
CREATE INDEX "idx_trips_deleted_at" ON "trips"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_destinations_country" ON "destinations"("country");

-- CreateIndex
CREATE INDEX "idx_destinations_name" ON "destinations"("name");

-- CreateIndex
CREATE INDEX "idx_destinations_region" ON "destinations"("region");

-- CreateIndex
CREATE INDEX "idx_trip_stops_trip_id" ON "trip_stops"("trip_id");

-- CreateIndex
CREATE INDEX "idx_trip_stops_destination_id" ON "trip_stops"("destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stops_trip_id_stop_order_key" ON "trip_stops"("trip_id", "stop_order");

-- CreateIndex
CREATE INDEX "idx_trip_sections_trip_id" ON "trip_sections"("trip_id");

-- CreateIndex
CREATE INDEX "idx_trip_sections_trip_stop_id" ON "trip_sections"("trip_stop_id");

-- CreateIndex
CREATE INDEX "idx_trip_sections_type" ON "trip_sections"("section_type");

-- CreateIndex
CREATE UNIQUE INDEX "trip_sections_trip_id_section_order_key" ON "trip_sections"("trip_id", "section_order");

-- CreateIndex
CREATE INDEX "idx_activities_destination_id" ON "activities"("destination_id");

-- CreateIndex
CREATE INDEX "idx_activities_category" ON "activities"("category");

-- CreateIndex
CREATE INDEX "idx_itinerary_items_trip_stop_id" ON "itinerary_items"("trip_stop_id");

-- CreateIndex
CREATE INDEX "idx_itinerary_items_trip_section_id" ON "itinerary_items"("trip_section_id");

-- CreateIndex
CREATE INDEX "idx_itinerary_items_date" ON "itinerary_items"("item_date");

-- CreateIndex
CREATE INDEX "idx_itinerary_items_activity_id" ON "itinerary_items"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_items_trip_stop_id_item_date_item_order_key" ON "itinerary_items"("trip_stop_id", "item_date", "item_order");

-- CreateIndex
CREATE INDEX "idx_expenses_trip_id" ON "expenses"("trip_id");

-- CreateIndex
CREATE INDEX "idx_expenses_trip_section_id" ON "expenses"("trip_section_id");

-- CreateIndex
CREATE INDEX "idx_expenses_category" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "idx_expenses_date" ON "expenses"("expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "shared_trips_share_token_key" ON "shared_trips"("share_token");

-- CreateIndex
CREATE INDEX "idx_shared_trips_share_token" ON "shared_trips"("share_token");

-- CreateIndex
CREATE INDEX "idx_shared_trips_trip_id" ON "shared_trips"("trip_id");

-- CreateIndex
CREATE INDEX "idx_saved_destinations_user_id" ON "saved_destinations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_destinations_user_id_destination_id_key" ON "saved_destinations"("user_id", "destination_id");

-- CreateIndex
CREATE INDEX "idx_community_posts_user_id" ON "community_posts"("user_id");

-- CreateIndex
CREATE INDEX "idx_community_posts_trip_id" ON "community_posts"("trip_id");

-- CreateIndex
CREATE INDEX "idx_community_posts_destination_id" ON "community_posts"("destination_id");

-- CreateIndex
CREATE INDEX "idx_community_posts_created_at" ON "community_posts"("created_at");

-- CreateIndex
CREATE INDEX "idx_community_comments_post_id" ON "community_comments"("post_id");

-- CreateIndex
CREATE INDEX "idx_community_comments_user_id" ON "community_comments"("user_id");

-- CreateIndex
CREATE INDEX "idx_community_comments_parent" ON "community_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "idx_community_reactions_post_id" ON "community_reactions"("post_id");

-- CreateIndex
CREATE INDEX "idx_community_reactions_user_id" ON "community_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_reactions_post_id_user_id_key" ON "community_reactions"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_community_post_media_post_id" ON "community_post_media"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_media_post_id_display_order_key" ON "community_post_media"("post_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_sessions_user_id" ON "refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_sessions_token_hash" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_sessions_family_id" ON "refresh_sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_prt_user_id" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_prt_token_hash" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_evt_user_id" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_evt_token_hash" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_analytics_event_type" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_analytics_entity" ON "analytics_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_analytics_created_at" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "idx_analytics_user_id" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_request_id" ON "audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_copied_from_trip_id_fkey" FOREIGN KEY ("copied_from_trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_sections" ADD CONSTRAINT "trip_sections_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_sections" ADD CONSTRAINT "trip_sections_trip_stop_id_fkey" FOREIGN KEY ("trip_stop_id") REFERENCES "trip_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_stop_id_fkey" FOREIGN KEY ("trip_stop_id") REFERENCES "trip_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_section_id_fkey" FOREIGN KEY ("trip_section_id") REFERENCES "trip_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_stop_id_fkey" FOREIGN KEY ("trip_stop_id") REFERENCES "trip_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_section_id_fkey" FOREIGN KEY ("trip_section_id") REFERENCES "trip_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_itinerary_item_id_fkey" FOREIGN KEY ("itinerary_item_id") REFERENCES "itinerary_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_trips" ADD CONSTRAINT "shared_trips_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_destinations" ADD CONSTRAINT "saved_destinations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_destinations" ADD CONSTRAINT "saved_destinations_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_media" ADD CONSTRAINT "community_post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_media" ADD CONSTRAINT "community_post_media_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_replaced_by_fkey" FOREIGN KEY ("replaced_by") REFERENCES "refresh_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
