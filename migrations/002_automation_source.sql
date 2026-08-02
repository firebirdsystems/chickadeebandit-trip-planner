-- Automations open a trip on a member's behalf
-- (manifest.automation_actions.create_trip).
--
-- `source_event_id` records which app event produced the row. The dispatcher's
-- dedupe guard reads it before running an action (SELECT 1 ... WHERE
-- source_event_id = ? LIMIT 1), so one event can never be applied twice --
-- neither by a retry nor by two rules pointed at the same trigger.
--
-- Nullable on purpose: every trip the app's own UI creates leaves it NULL.
ALTER TABLE app_trip_planner__trips ADD COLUMN source_event_id TEXT;

CREATE INDEX IF NOT EXISTS app_trip_planner__trips_source_event_idx
  ON app_trip_planner__trips (source_event_id);
