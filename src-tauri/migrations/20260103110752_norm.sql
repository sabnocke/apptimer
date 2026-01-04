-- Add migration script here
-- BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS events_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    window_title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    temp_end_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME
);

INSERT OR IGNORE INTO processes(name)
SELECT DISTINCT process_name
FROM activity_log;

INSERT INTO events_new (process_id, window_title, start_time, temp_end_time, end_time)
SELECT
    p.id,
    old.window_title,
    old.start_time,
    old.temp_end_time,
    old.end_time
FROM activity_log old
JOIN processes p ON old.process_name = p.name;

DROP TABLE activity_log;
ALTER TABLE events_new RENAME TO events;

CREATE INDEX idx_events_process_id ON events(process_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_end_time ON events(end_time);

-- COMMIT;

-- VACUUM;