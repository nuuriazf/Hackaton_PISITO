INSERT INTO users (id, username, password) VALUES
(100, 'demo_user', '$2a$10$HfLBZNMQCT95Hg5IBqI4J.CVrHW6CakFGVFLfg6sVFFhEJ5bLPu9q');

INSERT INTO entries (id, owner_id, title, created_at, updated_at) VALUES
(100, 100, 'Ideas de producto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(101, 100, 'Referencias', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO resources (id, entry_id, resource_type, title, created_at) VALUES
(100, 100, 'TEXT', 'Nota inicial', CURRENT_TIMESTAMP),
(101, 101, 'LINK', 'Inspiracion', CURRENT_TIMESTAMP),
(102, 101, 'MEDIA', 'Demo referencia', CURRENT_TIMESTAMP),
(103, 101, 'MEDIA', 'Mock imagen', CURRENT_TIMESTAMP);

INSERT INTO text_resources (id, text_content) VALUES
(100, 'Idea para el proyecto: guardar contenido multimedia.');

INSERT INTO link_resources (id, url) VALUES
(101, 'https://supabase.com/docs/guides/storage');

INSERT INTO media_resources (id, storage_key, file_name, mime_type) VALUES
(102, 'videos/demo.mp4', 'demo.mp4', 'video/mp4'),
(103, 'images/demo-image.png', 'demo-image.png', 'image/png');

INSERT INTO tags (id, name, created_at) VALUES
(100, 'importante', CURRENT_TIMESTAMP),
(101, 'trabajo', CURRENT_TIMESTAMP),
(102, 'personal', CURRENT_TIMESTAMP),
(103, 'urgente', CURRENT_TIMESTAMP);

INSERT INTO entry_tags (entry_id, tag_id) VALUES
(100, 100),
(100, 101),
(101, 102);
