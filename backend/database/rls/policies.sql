-- =============================================================================
-- GLOBETROTTER DATABASE CONSTRAINTS & ROW-LEVEL SECURITY (RLS) POLICIES
-- PostgreSQL 16 Enterprise Security Baseline
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DATABASE CHECK CONSTRAINTS (Business Integrity Safety Net)
-- -----------------------------------------------------------------------------

-- trips table constraints
ALTER TABLE trips ADD CONSTRAINT chk_trip_dates CHECK (end_date >= start_date);
ALTER TABLE trips ADD CONSTRAINT chk_trip_budget_positive CHECK (budget_limit IS NULL OR budget_limit >= 0);

-- trip_stops table constraints
ALTER TABLE trip_stops ADD CONSTRAINT chk_stop_dates CHECK (departure_date >= arrival_date);
ALTER TABLE trip_stops ADD CONSTRAINT chk_stop_order_positive CHECK (stop_order >= 0);

-- trip_sections table constraints
ALTER TABLE trip_sections ADD CONSTRAINT chk_section_dates CHECK (end_date >= start_date);
ALTER TABLE trip_sections ADD CONSTRAINT chk_section_budget_positive CHECK (planned_budget IS NULL OR planned_budget >= 0);
ALTER TABLE trip_sections ADD CONSTRAINT chk_section_order_positive CHECK (section_order >= 0);

-- activities table constraints
ALTER TABLE activities ADD CONSTRAINT chk_activity_cost_positive CHECK (estimated_cost IS NULL OR estimated_cost >= 0);
ALTER TABLE activities ADD CONSTRAINT chk_activity_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0);
ALTER TABLE activities ADD CONSTRAINT chk_activity_rating_range CHECK (rating IS NULL OR (rating >= 0.0 AND rating <= 5.0));

-- itinerary_items table constraints
ALTER TABLE itinerary_items ADD CONSTRAINT chk_item_order_positive CHECK (item_order >= 0);

-- expenses table constraints
ALTER TABLE expenses ADD CONSTRAINT chk_expense_amount_positive CHECK (amount >= 0);

-- media_files table constraints
ALTER TABLE media_files ADD CONSTRAINT chk_media_filesize_positive CHECK (file_size > 0 AND file_size <= 5242880);

-- destinations table constraints
ALTER TABLE destinations ADD CONSTRAINT chk_destination_cost_index CHECK (cost_index IS NULL OR (cost_index >= 1 AND cost_index <= 5));

-- -----------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY (RLS) ACTIVATION & POLICIES
-- -----------------------------------------------------------------------------

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_own ON users;
CREATE POLICY users_own ON users FOR ALL
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      id = current_setting('app.current_user_id', true)::uuid AND
      deleted_at IS NULL
    );

-- MEDIA_FILES (Direct ownership)
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS files_own ON media_files;
CREATE POLICY files_own ON media_files FOR ALL
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      owner_user_id = current_setting('app.current_user_id', true)::uuid
    );

-- TRIPS (Direct ownership)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trips_own ON trips;
CREATE POLICY trips_own ON trips FOR ALL
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid AND
      deleted_at IS NULL
    );

-- TRIP_STOPS (Ownership through trips)
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stops_own ON trip_stops;
CREATE POLICY stops_own ON trip_stops FOR ALL
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              user_id = current_setting('app.current_user_id', true)::uuid AND
              deleted_at IS NULL
      )
    );

-- TRIP_SECTIONS (Ownership through trips)
ALTER TABLE trip_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_sections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sections_own ON trip_sections;
CREATE POLICY sections_own ON trip_sections FOR ALL
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              user_id = current_setting('app.current_user_id', true)::uuid AND
              deleted_at IS NULL
      )
    );

-- ITINERARY_ITEMS (Ownership through trip_stops -> trips)
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS items_own ON itinerary_items;
CREATE POLICY items_own ON itinerary_items FOR ALL
    USING (
      trip_stop_id IN (
        SELECT ts.id FROM trip_stops ts
        JOIN trips t ON ts.trip_id = t.id
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              t.user_id = current_setting('app.current_user_id', true)::uuid AND
              t.deleted_at IS NULL
      )
    );

-- EXPENSES (Ownership through trips)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_own ON expenses;
CREATE POLICY expenses_own ON expenses FOR ALL
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              user_id = current_setting('app.current_user_id', true)::uuid AND
              deleted_at IS NULL
      )
    );

-- SAVED_DESTINATIONS (Direct ownership)
ALTER TABLE saved_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_destinations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS saved_own ON saved_destinations;
CREATE POLICY saved_own ON saved_destinations FOR ALL
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

-- SHARED_TRIPS
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_trips FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shared_read ON shared_trips;
CREATE POLICY shared_read ON shared_trips FOR SELECT
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS shared_own_write ON shared_trips;
CREATE POLICY shared_own_write ON shared_trips FOR INSERT
    WITH CHECK (
      trip_id IN (
        SELECT id FROM trips
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              user_id = current_setting('app.current_user_id', true)::uuid
      )
    );

DROP POLICY IF EXISTS shared_own_delete ON shared_trips;
CREATE POLICY shared_own_delete ON shared_trips FOR DELETE
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE current_setting('app.current_user_id', true) IS NOT NULL AND
              current_setting('app.current_user_id', true) <> '' AND
              user_id = current_setting('app.current_user_id', true)::uuid
      )
    );

-- COMMUNITY_POSTS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS posts_read ON community_posts;
CREATE POLICY posts_read ON community_posts FOR SELECT
    USING (visibility = 'public' AND deleted_at IS NULL);

DROP POLICY IF EXISTS posts_own_insert ON community_posts;
CREATE POLICY posts_own_insert ON community_posts FOR INSERT
    WITH CHECK (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

DROP POLICY IF EXISTS posts_own_update ON community_posts;
CREATE POLICY posts_own_update ON community_posts FOR UPDATE
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid AND
      deleted_at IS NULL
    );

DROP POLICY IF EXISTS posts_own_delete ON community_posts;
CREATE POLICY posts_own_delete ON community_posts FOR DELETE
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

-- COMMUNITY_COMMENTS
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_read ON community_comments;
CREATE POLICY comments_read ON community_comments FOR SELECT
    USING (
      post_id IN (
        SELECT id FROM community_posts WHERE visibility = 'public' AND deleted_at IS NULL
      ) AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS comments_own_insert ON community_comments;
CREATE POLICY comments_own_insert ON community_comments FOR INSERT
    WITH CHECK (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

DROP POLICY IF EXISTS comments_own_update ON community_comments;
CREATE POLICY comments_own_update ON community_comments FOR UPDATE
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

DROP POLICY IF EXISTS comments_own_delete ON community_comments;
CREATE POLICY comments_own_delete ON community_comments FOR DELETE
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

-- COMMUNITY_REACTIONS
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reactions_read ON community_reactions;
CREATE POLICY reactions_read ON community_reactions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS reactions_own_insert ON community_reactions;
CREATE POLICY reactions_own_insert ON community_reactions FOR INSERT
    WITH CHECK (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

DROP POLICY IF EXISTS reactions_own_delete ON community_reactions;
CREATE POLICY reactions_own_delete ON community_reactions FOR DELETE
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

-- DESTINATIONS & ACTIVITIES (Public Read Reference Data)
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS destinations_read ON destinations;
CREATE POLICY destinations_read ON destinations FOR SELECT USING (TRUE);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activities_read ON activities;
CREATE POLICY activities_read ON activities FOR SELECT USING (TRUE);

-- SYSTEM TABLES (Audit logs, Analytics, Tokens: No direct user policy - Service role access)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY;

ALTER TABLE refresh_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS refresh_sessions_own ON refresh_sessions;
CREATE POLICY refresh_sessions_own ON refresh_sessions FOR ALL
    USING (
      current_setting('app.current_user_id', true) IS NOT NULL AND
      current_setting('app.current_user_id', true) <> '' AND
      user_id = current_setting('app.current_user_id', true)::uuid
    );

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens FORCE ROW LEVEL SECURITY;
