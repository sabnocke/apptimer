-- Add migration script here
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_name TEXT NOT NULL,
    window_title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    temp_end_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME
);