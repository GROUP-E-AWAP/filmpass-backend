-- Movies - Popular films from various genres with prices
INSERT INTO movies (id, title, description, duration_minutes, poster_url, price) VALUES
('mov-dune', 'Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future only he can foresee.', 166, 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 14.99),
('mov-oppenheimer', 'Oppenheimer', 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II. A thrilling exploration of the man whose work changed the course of history forever.', 180, 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 15.99),
('mov-interstellar', 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival. An epic journey across time and space where love and sacrifice transcend dimensions.', 169, 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 13.99),
('mov-inception', 'Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O. Reality and dreams blur in this mind-bending thriller.', 148, 'https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg', 12.99),
('mov-dark-knight', 'The Dark Knight', 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy. A gripping tale of heroism, chaos, and the thin line between good and evil.', 152, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 11.99),
('mov-lotr-fellowship', 'The Lord of the Rings: The Fellowship of the Ring', 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron. An epic fantasy adventure begins.', 178, 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 13.99),
('mov-parasite', 'Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan. A darkly comedic thriller that exposes societal divides.', 132, 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 12.49),
('mov-barbie', 'Barbie', 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.', 114, 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 13.49),
('mov-avatar-2', 'Avatar: The Way of Water', 'Set more than a decade after the events of the first film, learn the story of the Sully family, the trouble that follows them, and the lengths they go to keep each other safe. Return to Pandora in this visually stunning sequel.', 192, 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 16.99),
('mov-top-gun', 'Top Gun: Maverick', 'After more than 30 years of service as one of the Navy''s top aviators, Pete "Maverick" Mitchell pushes the envelope as a test pilot while training a detachment of Top Gun graduates for a specialized mission.', 130, 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 14.49),
('mov-everything', 'Everything Everywhere All at Once', 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led. A mind-bending multiverse adventure.', 139, 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', 13.99),
('mov-spiderman', 'Spider-Man: Across the Spider-Verse', 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.', 140, 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 14.99);

-- Auditoriums - Multiple screens for variety
INSERT INTO auditoriums (id, name, seat_rows, seat_cols) VALUES
('aud-1', 'Screen 1 - IMAX', 8, 10),
('aud-2', 'Screen 2 - Standard', 6, 8),
('aud-3', 'Screen 3 - VIP', 4, 6);

-- Seats for Screen 1 (IMAX) - 8x10: rows A..H, seats 1..10
INSERT INTO seats (id, auditorium_id, row_label, seat_number)
SELECT 
  'seat-1-' || r || n,
  'aud-1',
  r,
  n
FROM (
  SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) AS r
) AS rows
CROSS JOIN (
  SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) AS n
) AS nums;

-- Seats for Screen 2 (Standard) - 6x8: rows A..F, seats 1..8
INSERT INTO seats (id, auditorium_id, row_label, seat_number)
SELECT 
  'seat-2-' || r || n,
  'aud-2',
  r,
  n
FROM (
  SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F']) AS r
) AS rows
CROSS JOIN (
  SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]) AS n
) AS nums;

-- Seats for Screen 3 (VIP) - 4x6: rows A..D, seats 1..6
INSERT INTO seats (id, auditorium_id, row_label, seat_number)
SELECT 
  'seat-3-' || r || n,
  'aud-3',
  r,
  n
FROM (
  SELECT unnest(ARRAY['A', 'B', 'C', 'D']) AS r
) AS rows
CROSS JOIN (
  SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6]) AS n
) AS nums;

-- Showtimes - Multiple showings across different screens for the next 3 days
INSERT INTO showtimes (id, movie_id, auditorium_id, start_time, end_time, price_adult, price_child) VALUES
-- Today
('show-dune-1', 'mov-dune', 'aud-1', (NOW() + INTERVAL '14 hours')::TEXT, (NOW() + INTERVAL '14 hours' + INTERVAL '166 minutes')::TEXT, 15.00, 10.00),
('show-dune-2', 'mov-dune', 'aud-1', (NOW() + INTERVAL '19.5 hours')::TEXT, (NOW() + INTERVAL '19.5 hours' + INTERVAL '166 minutes')::TEXT, 15.00, 10.00),
('show-oppenheimer-1', 'mov-oppenheimer', 'aud-2', (NOW() + INTERVAL '13 hours')::TEXT, (NOW() + INTERVAL '13 hours' + INTERVAL '180 minutes')::TEXT, 14.00, 9.50),
('show-oppenheimer-2', 'mov-oppenheimer', 'aud-2', (NOW() + INTERVAL '18 hours')::TEXT, (NOW() + INTERVAL '18 hours' + INTERVAL '180 minutes')::TEXT, 14.00, 9.50),
('show-barbie-1', 'mov-barbie', 'aud-3', (NOW() + INTERVAL '15 hours')::TEXT, (NOW() + INTERVAL '15 hours' + INTERVAL '114 minutes')::TEXT, 16.00, 11.00),
('show-barbie-2', 'mov-barbie', 'aud-3', (NOW() + INTERVAL '20 hours')::TEXT, (NOW() + INTERVAL '20 hours' + INTERVAL '114 minutes')::TEXT, 16.00, 11.00),

-- Tomorrow (+1 day)
('show-interstellar-1', 'mov-interstellar', 'aud-1', (NOW() + INTERVAL '1 day' + INTERVAL '13 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '13 hours' + INTERVAL '169 minutes')::TEXT, 15.00, 10.00),
('show-interstellar-2', 'mov-interstellar', 'aud-1', (NOW() + INTERVAL '1 day' + INTERVAL '18 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '18 hours' + INTERVAL '169 minutes')::TEXT, 15.00, 10.00),
('show-inception-1', 'mov-inception', 'aud-2', (NOW() + INTERVAL '1 day' + INTERVAL '14 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '148 minutes')::TEXT, 13.50, 9.00),
('show-inception-2', 'mov-inception', 'aud-2', (NOW() + INTERVAL '1 day' + INTERVAL '19 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '19 hours' + INTERVAL '148 minutes')::TEXT, 13.50, 9.00),
('show-dark-knight-1', 'mov-dark-knight', 'aud-3', (NOW() + INTERVAL '1 day' + INTERVAL '16 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '16 hours' + INTERVAL '152 minutes')::TEXT, 16.00, 11.00),
('show-dark-knight-2', 'mov-dark-knight', 'aud-3', (NOW() + INTERVAL '1 day' + INTERVAL '21 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '21 hours' + INTERVAL '152 minutes')::TEXT, 16.00, 11.00),
('show-avatar-1', 'mov-avatar-2', 'aud-2', (NOW() + INTERVAL '1 day' + INTERVAL '12 hours')::TEXT, (NOW() + INTERVAL '1 day' + INTERVAL '12 hours' + INTERVAL '192 minutes')::TEXT, 14.00, 9.50),

-- Day after tomorrow (+2 days)
('show-lotr-1', 'mov-lotr-fellowship', 'aud-1', (NOW() + INTERVAL '2 days' + INTERVAL '13.5 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '13.5 hours' + INTERVAL '178 minutes')::TEXT, 15.00, 10.00),
('show-lotr-2', 'mov-lotr-fellowship', 'aud-1', (NOW() + INTERVAL '2 days' + INTERVAL '19 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '19 hours' + INTERVAL '178 minutes')::TEXT, 15.00, 10.00),
('show-parasite-1', 'mov-parasite', 'aud-2', (NOW() + INTERVAL '2 days' + INTERVAL '15 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '15 hours' + INTERVAL '132 minutes')::TEXT, 13.00, 8.50),
('show-parasite-2', 'mov-parasite', 'aud-2', (NOW() + INTERVAL '2 days' + INTERVAL '20 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '20 hours' + INTERVAL '132 minutes')::TEXT, 13.00, 8.50),
('show-top-gun-1', 'mov-top-gun', 'aud-3', (NOW() + INTERVAL '2 days' + INTERVAL '14.5 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '14.5 hours' + INTERVAL '130 minutes')::TEXT, 16.00, 11.00),
('show-top-gun-2', 'mov-top-gun', 'aud-3', (NOW() + INTERVAL '2 days' + INTERVAL '19.5 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '19.5 hours' + INTERVAL '130 minutes')::TEXT, 16.00, 11.00),
('show-everything-1', 'mov-everything', 'aud-1', (NOW() + INTERVAL '2 days' + INTERVAL '11 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '11 hours' + INTERVAL '139 minutes')::TEXT, 15.00, 10.00),
('show-spiderman-1', 'mov-spiderman', 'aud-2', (NOW() + INTERVAL '2 days' + INTERVAL '11.5 hours')::TEXT, (NOW() + INTERVAL '2 days' + INTERVAL '11.5 hours' + INTERVAL '140 minutes')::TEXT, 14.00, 9.50);