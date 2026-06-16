SELECT
  t.id,
  t.title,
  t.destination,
  t.start_date,
  t.end_date,
  t.status,
  t.notes
FROM app_trip_planner__trips t
ORDER BY t.start_date DESC
LIMIT 50
