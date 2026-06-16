SELECT
  t.id,
  t.title,
  t.destination,
  t.start_date,
  t.end_date,
  t.status,
  t.notes
FROM app_trip_planner__trips t
WHERE t.end_date >= CURRENT_DATE
  AND t.status != 'cancelled'
ORDER BY t.start_date
LIMIT 20
