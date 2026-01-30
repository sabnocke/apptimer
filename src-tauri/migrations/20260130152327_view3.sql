-- Add migration script here
CREATE VIEW view_daily_app_stats AS
SELECT
    -- 1. The Grouping Key: The specific Day
    --    Extracts '2025-01-01' from '2025-01-01T14:30:00'
    date(evt.start_time, 'localtime') as day,

    -- 2. Identification
    COALESCE(dict.display_name, proc.name, 'Unknown') as final_name,
    proc.name as process_key,

    -- 3. Daily Totals
    --    This sum is ONLY for this specific app on this specific day
    SUM(unixepoch(evt.end_time) - unixepoch(evt.start_time)) as daily_seconds,
    COUNT(evt.id) as daily_sessions

FROM events evt
         JOIN processes proc ON evt.process_id = proc.id
         LEFT JOIN app_dictionary dict ON proc.name = dict.process_key

-- Group by BOTH the Day and the App
GROUP BY date(evt.start_time), proc.name;-- Add migration script here
