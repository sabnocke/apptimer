CREATE TABLE app_recognition_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_key TEXT NOT NULL, -- The trigger process name
    title_pattern TEXT NOT NULL, -- The matcher (e.g. "%Minecraft%)
    display_name TEXT NOT NULL, -- The new resolved name
    priority INTEGER DEFAULT 0 -- In case multiple matches exist
);