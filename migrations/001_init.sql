CREATE TABLE IF NOT EXISTS trips (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  title        TEXT NOT NULL,
  destination  TEXT NOT NULL DEFAULT '',
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planning',
  notes        TEXT NOT NULL DEFAULT '',
  created_by   TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS trip_members (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  trip_id      TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  added_at     TEXT NOT NULL,
  PRIMARY KEY (household_id, id),
  UNIQUE (household_id, trip_id, member_id)
);

CREATE TABLE IF NOT EXISTS itinerary_items (
  household_id      UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
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
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS packing_items (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  trip_id      TEXT NOT NULL,
  member_id    TEXT,
  label        TEXT NOT NULL,
  checked      INTEGER NOT NULL DEFAULT 0,
  checked_by   TEXT,
  checked_at   TEXT,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);
