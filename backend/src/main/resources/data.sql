INSERT INTO entries (id, title, "createDate", "updateDate", "userId") VALUES
(1, 'Ideas de producto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
(2, 'Referencias', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO resources (id, "entryId") VALUES
(1, 1),
(2, 2),
(3, 2),
(4, 2);

INSERT INTO texts (id, text) VALUES
(1, 'Idea para el proyecto: guardar contenido multimedia.');

INSERT INTO links (id, url) VALUES
(2, 'https://supabase.com/docs/guides/storage');

INSERT INTO "mediaResources" (id, path) VALUES
(3, 'videos/demo.mp4'),
(4, 'images/demo-image.png');

SELECT setval(pg_get_serial_sequence('entries', 'id'), (SELECT COALESCE(MAX(id), 1) FROM entries), true);
SELECT setval(pg_get_serial_sequence('resources', 'id'), (SELECT COALESCE(MAX(id), 1) FROM resources), true);
