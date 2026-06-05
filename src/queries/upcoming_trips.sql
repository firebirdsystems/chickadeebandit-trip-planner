SELECT
  t.id,
  t.title,
  t.destination,
  t.start_date,
  t.end_date,
  t.status,
  t.notes
FROM trips t
WHERE t.household_id = current_setting('app.household_id', true)::uuid
  AND t.end_date >= CURRENT_DATE::text
  AND t.status != 'cancelled'
ORDER BY t.start_date
LIMIT 20
