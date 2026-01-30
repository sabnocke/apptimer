CREATE VIEW view_smart_app_stats AS
    SELECT
        date(evt.start_time, 'localtime') as day,
        coalesce(
        (SELECT display_name FROM app_recognition_rules
                             WHERE process_key = proc.name
                             AND evt.window_title LIKE title_pattern
                             ORDER BY priority DESC LIMIT 1),
        dict.display_name,
        proc.name
        ) as final_name,
        proc.name as process_key,

        SUM(unixepoch(evt.end_time) - unixepoch(evt.start_time)) as total_seconds,
        COUNT(evt.id) as session_count
    FROM events evt
    JOIN processes proc ON evt.process_id = proc.id
    LEFT JOIN app_dictionary dict ON proc.name = dict.process_key
    GROUP BY day, final_name;
