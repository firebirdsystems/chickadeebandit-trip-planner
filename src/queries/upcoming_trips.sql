SELECT
  t.id,
  t.title,
  t.destination,
  t.start_date,
  t.end_date,
  t.status,
  t.notes
FROM app_trip_planner__trips t
-- end_date is a household-local calendar date. CURRENT_DATE is UTC, which drops
-- a trip that is still running (or keeps one that ended) for part of every day.
WHERE t.end_date >= :today
  AND t.status != 'cancelled'
ORDER BY t.start_date
LIMIT 20
