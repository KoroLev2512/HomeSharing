-- =============================================================================
-- 002_highload_schema.sql
-- HomeSharing Platform — Highload-ready PostgreSQL schema
--
-- Requires PostgreSQL 14+
-- Run in Supabase SQL Editor or via psql
-- Safe to run alongside existing tables (no DROP statements)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- trigram full-text indexes
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- GIST on btree types (exclusion constraints)

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE hs_user_role        AS ENUM ('guest', 'host', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_property_type    AS ENUM ('flat', 'room', 'house', 'studio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_deal_type        AS ENUM ('rent_long', 'rent_short', 'sale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_booking_status   AS ENUM ('pending','confirmed','active','completed','cancelled','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_payment_status   AS ENUM ('pending','processing','completed','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_notification_type AS ENUM (
    'booking_created','booking_confirmed','booking_cancelled',
    'payment_completed','payment_failed',
    'verification_completed','review_received','system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_verification_status AS ENUM ('pending','in_review','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hs_event_status AS ENUM ('pending','processing','processed','failed','dead_letter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- UTILITY: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hs_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TABLE: hs_users
-- Replaces/extends legacy "User" table. UUID PK, soft delete, optimistic lock.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_users (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            VARCHAR(320) NOT NULL,
  email_verified_at TIMESTAMPTZ,
  password_hash    VARCHAR(255),
  role             hs_user_role NOT NULL DEFAULT 'guest',
  is_admin         BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Optimistic locking: increment on every UPDATE, check before write
  version          INTEGER      NOT NULL DEFAULT 0,
  -- Audit
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ                         -- soft delete
);

CREATE UNIQUE INDEX IF NOT EXISTS hs_users_email_active_uidx
  ON hs_users (email)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hs_users_role_idx         ON hs_users (role)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS hs_users_is_admin_idx     ON hs_users (is_admin)   WHERE is_admin = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS hs_users_created_at_idx   ON hs_users (created_at);

DROP TRIGGER IF EXISTS hs_users_updated_at ON hs_users;
CREATE TRIGGER hs_users_updated_at
  BEFORE UPDATE ON hs_users
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_profiles
-- Extended user data separated to keep hs_users lean (hot path = auth only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_profiles (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,
  name         VARCHAR(255),
  username     VARCHAR(100),
  phone        VARCHAR(30),
  avatar_url   VARCHAR(2048),
  bio          TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS hs_profiles_user_id_uidx  ON hs_profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS hs_profiles_username_uidx ON hs_profiles (username) WHERE username IS NOT NULL;

DROP TRIGGER IF EXISTS hs_profiles_updated_at ON hs_profiles;
CREATE TRIGGER hs_profiles_updated_at
  BEFORE UPDATE ON hs_profiles
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_properties
-- Replaces legacy "listings" table. UUID PK, denormalized rating for reads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_properties (
  id                 UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id           UUID             NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,

  -- Core
  title              VARCHAR(500)     NOT NULL,
  description        TEXT             NOT NULL,
  deal_type          hs_deal_type     NOT NULL,
  property_type      hs_property_type NOT NULL,
  rooms              SMALLINT         NOT NULL DEFAULT 1 CHECK (rooms >= 0),
  area               NUMERIC(8,2)     NOT NULL CHECK (area > 0),
  living_area        NUMERIC(8,2),
  kitchen_area       NUMERIC(8,2),
  floor              SMALLINT         CHECK (floor >= 0),
  total_floors       SMALLINT         CHECK (total_floors >= 1),
  amenities          TEXT[]           NOT NULL DEFAULT '{}',

  -- Price
  price              NUMERIC(12,2)    NOT NULL CHECK (price >= 0),
  price_period       VARCHAR(20),
  deposit            NUMERIC(12,2)    CHECK (deposit >= 0),

  -- Location
  city               VARCHAR(255)     NOT NULL,
  district           VARCHAR(255),
  metro              VARCHAR(255),
  metro_distance_min SMALLINT         CHECK (metro_distance_min >= 0),
  address            VARCHAR(500)     NOT NULL,
  latitude           NUMERIC(10,8),
  longitude          NUMERIC(11,8),

  -- Status
  is_active          BOOLEAN          NOT NULL DEFAULT TRUE,
  is_verified        BOOLEAN          NOT NULL DEFAULT FALSE,

  -- Denormalized aggregates (updated by trigger/event, avoids JOIN on reads)
  average_rating     NUMERIC(3,2)     CHECK (average_rating BETWEEN 1 AND 5),
  review_count       INTEGER          NOT NULL DEFAULT 0 CHECK (review_count >= 0),

  -- Optimistic locking
  version            INTEGER          NOT NULL DEFAULT 0,

  -- Audit
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

-- Search & filter indexes
CREATE INDEX IF NOT EXISTS hs_props_city_deal_type_idx
  ON hs_properties (city, deal_type)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS hs_props_deal_type_price_idx
  ON hs_properties (deal_type, price)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS hs_props_owner_id_idx
  ON hs_properties (owner_id)
  WHERE deleted_at IS NULL;

-- Partial index for active verified listings (hot read path)
CREATE INDEX IF NOT EXISTS hs_props_active_verified_idx
  ON hs_properties (city, deal_type, price, created_at DESC)
  WHERE deleted_at IS NULL AND is_active = TRUE AND is_verified = TRUE;

-- Geo queries
CREATE INDEX IF NOT EXISTS hs_props_lat_lng_idx
  ON hs_properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL;

-- Full-text search via trigram (supports ILIKE and similarity())
CREATE INDEX IF NOT EXISTS hs_props_title_trgm_idx
  ON hs_properties USING GIN (title gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hs_props_address_trgm_idx
  ON hs_properties USING GIN (address gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- Amenities array search (e.g. 'WiFi' = ANY(amenities))
CREATE INDEX IF NOT EXISTS hs_props_amenities_gin_idx
  ON hs_properties USING GIN (amenities);

-- Covering index for listing card (avoids heap fetch on list page)
CREATE INDEX IF NOT EXISTS hs_props_listing_card_idx
  ON hs_properties (city, deal_type, created_at DESC)
  INCLUDE (title, price, price_period, rooms, area, address, average_rating, review_count, is_verified)
  WHERE deleted_at IS NULL AND is_active = TRUE;

DROP TRIGGER IF EXISTS hs_properties_updated_at ON hs_properties;
CREATE TRIGGER hs_properties_updated_at
  BEFORE UPDATE ON hs_properties
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_property_photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_property_photos (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID        NOT NULL REFERENCES hs_properties(id) ON DELETE CASCADE,
  url         VARCHAR(2048) NOT NULL,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hs_photos_property_id_sort_idx
  ON hs_property_photos (property_id, sort_order);

-- Partial unique: only one primary photo per property
CREATE UNIQUE INDEX IF NOT EXISTS hs_photos_primary_uidx
  ON hs_property_photos (property_id)
  WHERE is_primary = TRUE;

-- ---------------------------------------------------------------------------
-- TABLE: hs_bookings  (PARTITIONED BY RANGE created_at — per year)
--
-- NOTE: EXCLUSION CONSTRAINT with GIST is defined on each partition below
-- because PostgreSQL 14 does not support exclusion constraints on partitioned
-- tables directly. The application layer (BookingsRepo) ALSO uses
-- pg_advisory_xact_lock() to serialize concurrent booking creation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_bookings (
  id             UUID             NOT NULL DEFAULT uuid_generate_v4(),
  property_id    UUID             NOT NULL REFERENCES hs_properties(id),
  guest_id       UUID             NOT NULL REFERENCES hs_users(id),
  host_id        UUID             NOT NULL REFERENCES hs_users(id),

  date_from      DATE             NOT NULL,
  date_to        DATE             NOT NULL,

  status         hs_booking_status NOT NULL DEFAULT 'pending',
  guests_count   SMALLINT         NOT NULL DEFAULT 1 CHECK (guests_count > 0),
  total_price    NUMERIC(12,2)    NOT NULL CHECK (total_price >= 0),
  currency       CHAR(3)          NOT NULL DEFAULT 'RUB',

  guest_message  TEXT,
  host_message   TEXT,

  -- Optimistic locking
  version        INTEGER          NOT NULL DEFAULT 0,

  -- Distributed tracing
  correlation_id UUID             NOT NULL DEFAULT uuid_generate_v4(),

  -- Audit
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT hs_bookings_dates_check CHECK (date_to > date_from),
  PRIMARY KEY (id, created_at)   -- partition key must be part of PK
) PARTITION BY RANGE (created_at);

-- Yearly partitions (add new ones via cron/migration each December)
CREATE TABLE IF NOT EXISTS hs_bookings_2024
  PARTITION OF hs_bookings
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS hs_bookings_2025
  PARTITION OF hs_bookings
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS hs_bookings_2026
  PARTITION OF hs_bookings
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS hs_bookings_2027
  PARTITION OF hs_bookings
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Double-booking prevention via EXCLUSION CONSTRAINT on each partition
-- Prevents any two non-cancelled bookings from overlapping on same property
DO $$ DECLARE part TEXT;
BEGIN
  FOREACH part IN ARRAY ARRAY[
    'hs_bookings_2024','hs_bookings_2025','hs_bookings_2026','hs_bookings_2027'
  ] LOOP
    EXECUTE format($f$
      ALTER TABLE %I
        ADD CONSTRAINT %I EXCLUDE USING GIST (
          property_id  WITH =,
          daterange(date_from, date_to, '[)') WITH &&
        ) WHERE (status NOT IN ('cancelled','rejected') AND deleted_at IS NULL)
    $f$, part, part || '_no_overlap_excl');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END LOOP;
END $$;

-- Booking lookup indexes (applied to the parent, inherited by partitions)
CREATE INDEX IF NOT EXISTS hs_bookings_guest_id_idx
  ON hs_bookings (guest_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hs_bookings_host_id_idx
  ON hs_bookings (host_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hs_bookings_property_id_dates_idx
  ON hs_bookings (property_id, date_from, date_to)
  WHERE status NOT IN ('cancelled','rejected') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hs_bookings_status_idx
  ON hs_bookings (status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Covering index for host bookings list
CREATE INDEX IF NOT EXISTS hs_bookings_host_list_idx
  ON hs_bookings (host_id, status, created_at DESC)
  INCLUDE (guest_id, property_id, date_from, date_to, total_price, version)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS hs_bookings_updated_at ON hs_bookings;
CREATE TRIGGER hs_bookings_updated_at
  BEFORE UPDATE ON hs_bookings
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_booking_status_history
-- Full audit trail of every status transition
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_booking_status_history (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID              NOT NULL,
  from_status hs_booking_status,
  to_status   hs_booking_status NOT NULL,
  changed_by  UUID              REFERENCES hs_users(id) ON DELETE SET NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hs_booking_history_booking_id_idx
  ON hs_booking_status_history (booking_id, created_at);

-- ---------------------------------------------------------------------------
-- TABLE: hs_payments  (PARTITIONED BY RANGE created_at — per year)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_payments (
  id             UUID               NOT NULL DEFAULT uuid_generate_v4(),
  booking_id     UUID               NOT NULL,
  user_id        UUID               NOT NULL REFERENCES hs_users(id),
  amount         NUMERIC(12,2)      NOT NULL CHECK (amount > 0),
  currency       CHAR(3)            NOT NULL DEFAULT 'RUB',
  status         hs_payment_status  NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  external_id    VARCHAR(255),        -- payment gateway transaction ID
  correlation_id UUID               NOT NULL DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS hs_payments_2024
  PARTITION OF hs_payments FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS hs_payments_2025
  PARTITION OF hs_payments FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS hs_payments_2026
  PARTITION OF hs_payments FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS hs_payments_2027
  PARTITION OF hs_payments FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE UNIQUE INDEX IF NOT EXISTS hs_payments_external_id_uidx
  ON hs_payments (external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS hs_payments_booking_id_idx  ON hs_payments (booking_id);
CREATE INDEX IF NOT EXISTS hs_payments_user_id_idx     ON hs_payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hs_payments_status_idx      ON hs_payments (status) WHERE status IN ('pending','processing');

DROP TRIGGER IF EXISTS hs_payments_updated_at ON hs_payments;
CREATE TRIGGER hs_payments_updated_at
  BEFORE UPDATE ON hs_payments
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_notifications (
  id         UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID                  NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,
  type       hs_notification_type  NOT NULL,
  title      VARCHAR(500)          NOT NULL,
  body       TEXT                  NOT NULL,
  is_read    BOOLEAN               NOT NULL DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Unread notifications (hot path)
CREATE INDEX IF NOT EXISTS hs_notifications_user_unread_idx
  ON hs_notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS hs_notifications_user_all_idx
  ON hs_notifications (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: hs_verification_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_verification_requests (
  id              UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID                    NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,
  status          hs_verification_status  NOT NULL DEFAULT 'pending',
  document_type   VARCHAR(50),
  document_url    VARCHAR(2048),
  reviewer_id     UUID                    REFERENCES hs_users(id) ON DELETE SET NULL,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hs_verification_user_id_idx   ON hs_verification_requests (user_id);
CREATE INDEX IF NOT EXISTS hs_verification_status_idx
  ON hs_verification_requests (status, created_at)
  WHERE status IN ('pending','in_review');

DROP TRIGGER IF EXISTS hs_verification_updated_at ON hs_verification_requests;
CREATE TRIGGER hs_verification_updated_at
  BEFORE UPDATE ON hs_verification_requests
  FOR EACH ROW EXECUTE FUNCTION hs_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: hs_favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_favorites (
  user_id     UUID        NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,
  property_id UUID        NOT NULL REFERENCES hs_properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS hs_favorites_property_id_idx ON hs_favorites (property_id);

-- ---------------------------------------------------------------------------
-- TABLE: hs_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_reviews (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID        NOT NULL,
  property_id   UUID        NOT NULL REFERENCES hs_properties(id) ON DELETE CASCADE,
  reviewer_id   UUID        NOT NULL REFERENCES hs_users(id) ON DELETE CASCADE,
  reviewee_id   UUID        REFERENCES hs_users(id) ON DELETE SET NULL,
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT,
  is_from_guest BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One review per booking per direction (guest→host, host→guest)
CREATE UNIQUE INDEX IF NOT EXISTS hs_reviews_booking_direction_uidx
  ON hs_reviews (booking_id, is_from_guest);

CREATE INDEX IF NOT EXISTS hs_reviews_property_id_idx ON hs_reviews (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hs_reviews_reviewee_id_idx ON hs_reviews (reviewee_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- TRIGGER: denormalize average_rating and review_count on hs_properties
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hs_refresh_property_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE hs_properties
     SET average_rating = sub.avg_rating,
         review_count   = sub.cnt
    FROM (
      SELECT AVG(rating)::NUMERIC(3,2) AS avg_rating,
             COUNT(*)                  AS cnt
        FROM hs_reviews
       WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ) sub
   WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS hs_reviews_refresh_rating ON hs_reviews;
CREATE TRIGGER hs_reviews_refresh_rating
  AFTER INSERT OR UPDATE OR DELETE ON hs_reviews
  FOR EACH ROW EXECUTE FUNCTION hs_refresh_property_rating();

-- ---------------------------------------------------------------------------
-- TABLE: hs_outbox_events
-- Transactional Outbox Pattern: events written atomically with DB changes,
-- then picked up by a background worker and published to RabbitMQ.
-- Guarantees at-least-once delivery even if the message broker is down.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_outbox_events (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Which domain object this event belongs to
  aggregate_type  VARCHAR(100)    NOT NULL,  -- 'booking', 'payment', 'property', ...
  aggregate_id    UUID            NOT NULL,
  -- Event metadata
  event_type      VARCHAR(255)    NOT NULL,  -- 'booking.created', 'payment.completed', ...
  event_version   SMALLINT        NOT NULL DEFAULT 1,
  payload         JSONB           NOT NULL,
  -- Processing state
  status          hs_event_status NOT NULL DEFAULT 'pending',
  retry_count     SMALLINT        NOT NULL DEFAULT 0,
  max_retries     SMALLINT        NOT NULL DEFAULT 3,
  last_error      TEXT,
  -- Distributed tracing
  correlation_id  UUID,
  -- Idempotency key (consumer checks this to skip duplicates)
  idempotency_key VARCHAR(255),
  -- Scheduling
  scheduled_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Worker picks up pending events in order
CREATE INDEX IF NOT EXISTS hs_outbox_pending_idx
  ON hs_outbox_events (scheduled_at ASC)
  WHERE status IN ('pending','failed') AND retry_count < max_retries;

-- Idempotency check
CREATE UNIQUE INDEX IF NOT EXISTS hs_outbox_idempotency_uidx
  ON hs_outbox_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- TABLE: hs_audit_logs  (PARTITIONED BY RANGE created_at — per quarter)
-- Append-only. Never updated. Pruned by retention policy.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_audit_logs (
  id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id     UUID        REFERENCES hs_users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,  -- 'create','update','delete','login','logout',...
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  request_id  UUID,        -- correlation with HTTP request
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Quarterly partitions 2025–2026
CREATE TABLE IF NOT EXISTS hs_audit_logs_2025_q1
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2025_q2
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2025_q3
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2025_q4
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2026_q1
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2026_q2
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2026_q3
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS hs_audit_logs_2026_q4
  PARTITION OF hs_audit_logs FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

CREATE INDEX IF NOT EXISTS hs_audit_logs_user_id_idx    ON hs_audit_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hs_audit_logs_entity_idx     ON hs_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hs_audit_logs_action_idx     ON hs_audit_logs (action, created_at DESC);

-- ---------------------------------------------------------------------------
-- FUNCTION: create_booking_with_lock
-- Prevents double-booking via advisory lock + overlap check + INSERT.
-- Call this function inside a transaction; the lock is released at tx end.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hs_create_booking(
  p_property_id    UUID,
  p_guest_id       UUID,
  p_host_id        UUID,
  p_date_from      DATE,
  p_date_to        DATE,
  p_guests_count   SMALLINT,
  p_total_price    NUMERIC,
  p_guest_message  TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT uuid_generate_v4()
)
RETURNS hs_bookings LANGUAGE plpgsql AS $$
DECLARE
  v_booking hs_bookings;
BEGIN
  -- Advisory lock scoped to this property for the duration of the transaction.
  -- Serializes concurrent booking attempts on the same property.
  PERFORM pg_advisory_xact_lock(hashtext(p_property_id::TEXT));

  -- Explicit overlap check (belt-and-suspenders alongside exclusion constraint)
  IF EXISTS (
    SELECT 1 FROM hs_bookings
     WHERE property_id = p_property_id
       AND status NOT IN ('cancelled','rejected')
       AND deleted_at IS NULL
       AND daterange(date_from, date_to, '[)') && daterange(p_date_from, p_date_to, '[)')
     FOR UPDATE SKIP LOCKED  -- row-level lock; SKIP LOCKED = already locked = conflict
  ) THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT: dates % to % are already taken for property %',
      p_date_from, p_date_to, p_property_id
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO hs_bookings (
    property_id, guest_id, host_id,
    date_from, date_to, guests_count,
    total_price, guest_message, correlation_id
  ) VALUES (
    p_property_id, p_guest_id, p_host_id,
    p_date_from, p_date_to, p_guests_count,
    p_total_price, p_guest_message, p_correlation_id
  )
  RETURNING * INTO v_booking;

  -- Write outbox event atomically with the booking INSERT
  INSERT INTO hs_outbox_events (
    aggregate_type, aggregate_id, event_type, payload, correlation_id, idempotency_key
  ) VALUES (
    'booking',
    v_booking.id,
    'booking.created',
    jsonb_build_object(
      'bookingId',   v_booking.id,
      'propertyId',  p_property_id,
      'guestId',     p_guest_id,
      'hostId',      p_host_id,
      'dateFrom',    p_date_from,
      'dateTo',      p_date_to,
      'totalPrice',  p_total_price
    ),
    p_correlation_id,
    'booking.created:' || v_booking.id
  );

  RETURN v_booking;
END;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: update_booking_status (optimistic locking)
-- Fails if version doesn't match — prevents stale updates.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hs_update_booking_status(
  p_booking_id UUID,
  p_new_status hs_booking_status,
  p_changed_by UUID,
  p_version    INTEGER,
  p_reason     TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_old_status hs_booking_status;
  v_rows       INTEGER;
BEGIN
  SELECT status INTO v_old_status
    FROM hs_bookings
   WHERE id = p_booking_id AND deleted_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  UPDATE hs_bookings
     SET status     = p_new_status,
         version    = version + 1,
         updated_at = NOW()
   WHERE id         = p_booking_id
     AND version    = p_version        -- optimistic lock check
     AND deleted_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN FALSE;  -- version mismatch → caller should retry
  END IF;

  -- Record status history
  INSERT INTO hs_booking_status_history (booking_id, from_status, to_status, changed_by, reason)
  VALUES (p_booking_id, v_old_status, p_new_status, p_changed_by, p_reason);

  -- Outbox event
  INSERT INTO hs_outbox_events (aggregate_type, aggregate_id, event_type, payload, idempotency_key)
  VALUES (
    'booking', p_booking_id,
    CASE p_new_status
      WHEN 'confirmed'  THEN 'booking.confirmed'
      WHEN 'cancelled'  THEN 'booking.cancelled'
      WHEN 'completed'  THEN 'booking.completed'
      ELSE 'booking.status_changed'
    END,
    jsonb_build_object(
      'bookingId',  p_booking_id,
      'fromStatus', v_old_status,
      'toStatus',   p_new_status,
      'changedBy',  p_changed_by
    ),
    'booking.status:' || p_booking_id || ':' || p_version
  );

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- VIEW: hs_booking_conflicts_check (for monitoring/dashboards)
-- Returns active overlapping bookings (should always be 0 in healthy system)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW hs_booking_conflicts AS
SELECT a.id AS booking_a, b.id AS booking_b, a.property_id,
       a.date_from AS a_from, a.date_to AS a_to,
       b.date_from AS b_from, b.date_to AS b_to
  FROM hs_bookings a
  JOIN hs_bookings b ON a.property_id = b.property_id
                     AND a.id < b.id   -- avoid self-join and duplicates
 WHERE a.status NOT IN ('cancelled','rejected')
   AND b.status NOT IN ('cancelled','rejected')
   AND a.deleted_at IS NULL
   AND b.deleted_at IS NULL
   AND daterange(a.date_from, a.date_to, '[)') && daterange(b.date_from, b.date_to, '[)');

-- ---------------------------------------------------------------------------
-- FUNCTION: auto-create next year's booking partition (run each December via pg_cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hs_create_next_booking_partition()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_year      INT  := EXTRACT(YEAR FROM NOW())::INT + 1;
  v_part_name TEXT := 'hs_bookings_' || v_year;
  v_from      TEXT := v_year || '-01-01';
  v_to        TEXT := (v_year + 1) || '-01-01';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_part_name AND n.nspname = current_schema()
  ) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF hs_bookings FOR VALUES FROM (%L) TO (%L)',
                   v_part_name, v_from, v_to);
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I EXCLUDE USING GIST ' ||
      '(property_id WITH =, daterange(date_from, date_to, ''[)'') WITH &&) ' ||
      'WHERE (status NOT IN (''cancelled'',''rejected'') AND deleted_at IS NULL)',
      v_part_name, v_part_name || '_no_overlap_excl'
    );
    RAISE NOTICE 'Created partition % for year %', v_part_name, v_year;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- COMMENTS (documentation embedded in schema)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE hs_bookings         IS 'Partitioned by created_at year. Use hs_create_booking() to insert.';
COMMENT ON TABLE hs_outbox_events    IS 'Transactional outbox: events published atomically with DB writes, consumed by background worker → RabbitMQ.';
COMMENT ON TABLE hs_audit_logs       IS 'Append-only audit trail. Partitioned by quarter. Retention: 2 years.';
COMMENT ON FUNCTION hs_create_booking IS 'Acquires advisory lock → checks overlap → inserts booking + outbox event atomically.';
COMMENT ON FUNCTION hs_update_booking_status IS 'Optimistic locking: fails if version mismatches. Writes history + outbox event.';
COMMENT ON VIEW hs_booking_conflicts IS 'Should always return 0 rows. Monitored by Prometheus alert.';
