INSERT INTO entries (id, title, created_at, updated_at) VALUES
(1, 'Ideas de producto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Referencias', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO resources (id, entry_id, resource_type, title, created_at) VALUES
(1, 1, 'TEXT', 'Nota inicial', CURRENT_TIMESTAMP),
(2, 2, 'LINK', 'Inspiracion', CURRENT_TIMESTAMP),
(3, 2, 'MEDIA', 'Demo referencia', CURRENT_TIMESTAMP),
(4, 2, 'MEDIA', 'Mock imagen', CURRENT_TIMESTAMP);

INSERT INTO text_resources (id, text_content) VALUES
(1, 'Idea para el proyecto: guardar contenido multimedia.');

INSERT INTO link_resources (id, url) VALUES
(2, 'https://supabase.com/docs/guides/storage');

INSERT INTO media_resources (id, storage_key, file_name, mime_type) VALUES
(3, 'videos/demo.mp4', 'demo.mp4', 'video/mp4'),
(4, 'images/demo-image.png', 'demo-image.png', 'image/png');
