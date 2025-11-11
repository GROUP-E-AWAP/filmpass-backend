-- Movies
INSERT INTO movies (id, title, description, duration_minutes, poster_url) VALUES
('mov-dune', 'Dune', 'Desert, spice, politics.', 155, 'https://picsum.photos/seed/dune/300/450'),
('mov-interstellar', 'Interstellar', 'Space and time shenanigans.', 169, 'https://picsum.photos/seed/interstellar/300/450');

-- Auditorium
INSERT INTO auditoriums (id, name, seat_rows, seat_cols) VALUES
('aud-1', 'Screen 1', 5, 6);

-- Seats 5x6: rows A..E, seats 1..6
WITH rows AS (
  SELECT 'A' AS r UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL SELECT 'D' UNION ALL SELECT 'E'
),
nums AS (
  SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
)
INSERT INTO seats (id, auditorium_id, row_label, seat_number)
SELECT 'seat-' || r || n, 'aud-1', r, n
FROM rows CROSS JOIN nums;

-- Showtimes: два сеанса на завтра
INSERT INTO showtimes (id, movie_id, auditorium_id, start_time, end_time, price_adult, price_child) VALUES
('show-dune-1', 'mov-dune', 'aud-1', datetime('now', '+1 day', '13:00'), datetime('now', '+1 day', '15:35'), 12.50, 9.50),
('show-int-1', 'mov-interstellar', 'aud-1', datetime('now', '+1 day', '18:00'), datetime('now', '+1 day', '20:50'), 12.50, 9.50);
