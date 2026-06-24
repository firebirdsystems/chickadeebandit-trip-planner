CREATE TABLE IF NOT EXISTS app_trip_planner__trips (
  id           TEXT NOT NULL,
  title        TEXT NOT NULL,
  destination  TEXT NOT NULL DEFAULT '',
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planning',
  notes        TEXT NOT NULL DEFAULT '',
  created_by   TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_trip_planner__trip_members (
  id           TEXT NOT NULL,
  trip_id      TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  added_at     TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (trip_id, member_id)
);

CREATE TABLE IF NOT EXISTS app_trip_planner__itinerary_items (
  id                TEXT NOT NULL,
  trip_id           TEXT NOT NULL,
  item_date         TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  time              TEXT,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'other',
  booking_url       TEXT NOT NULL DEFAULT '',
  confirmation_code TEXT NOT NULL DEFAULT '',
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_trip_planner__packing_items (
  id           TEXT NOT NULL,
  trip_id      TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  label        TEXT NOT NULL,
  checked      INTEGER NOT NULL DEFAULT 0,
  checked_by   TEXT,
  checked_at   TEXT,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_trip_planner__shared_packing_items (
  id           TEXT NOT NULL,
  trip_id      TEXT NOT NULL,
  label        TEXT NOT NULL,
  checked      INTEGER NOT NULL DEFAULT 0,
  checked_by   TEXT,
  checked_at   TEXT,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS app_trip_planner__idx_trips_dates
  ON app_trip_planner__trips(start_date, end_date, status);

CREATE INDEX IF NOT EXISTS app_trip_planner__idx_trip_members_trip
  ON app_trip_planner__trip_members(trip_id, member_id);

CREATE INDEX IF NOT EXISTS app_trip_planner__idx_itinerary_trip_date
  ON app_trip_planner__itinerary_items(trip_id, item_date, sort_order, created_at);

CREATE INDEX IF NOT EXISTS app_trip_planner__idx_packing_trip_member
  ON app_trip_planner__packing_items(trip_id, member_id, created_at);

CREATE INDEX IF NOT EXISTS app_trip_planner__idx_shared_packing_trip
  ON app_trip_planner__shared_packing_items(trip_id, created_at);
