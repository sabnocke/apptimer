use std::fmt;
use chrono::{DateTime, Local, TimeZone, Utc};
use tauri::command;

use super::db::DB_CONN;

#[derive(serde::Serialize, sqlx::FromRow, serde::Deserialize, Clone, Debug)]
pub struct LogEntry {
    pub id: i64,
    pub process_name: String,
    pub window_title: String,
    pub start_time: DateTime<Utc>,
    pub temp_end_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
}

impl LogEntry {
    pub fn default() -> LogEntry {
        LogEntry {
            id: -1,
            process_name: String::default(),
            window_title: String::default(),
            start_time: Utc::now(),
            temp_end_time: Utc::now(),
            end_time: None,
        }
    }
}

impl fmt::Display for LogEntry {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "(id: {}, \n\
        process_name: {}, \n\
        window_title: {}, \n\
        start_time: {}, \n\
        temp_end_time: {}, \n\
        end_time: {:?})",
        self.id, self.process_name, self.window_title, self.start_time, self.temp_end_time, self.end_time)
    }
}

//TODO these might not return entries with end_time == null

#[command]
pub async fn get_logs_in_range(
    start: DateTime<Utc>,
    end: DateTime<Utc>,
) -> Result<Vec<LogEntry>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;

    let logs = sqlx::query_as!(
        LogEntry,
        r#"SELECT id, process_name, window_title,
        start_time as "start_time: chrono::DateTime<chrono::Utc>",
        temp_end_time as "temp_end_time: chrono::DateTime<chrono::Utc>",
        end_time as "end_time?: chrono::DateTime<chrono::Utc>"
        FROM activity_log
         WHERE start_time >= ? AND end_time <= ?
         ORDER BY start_time, end_time DESC
        "#,
        start,
        end,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(logs)
}

#[command]
pub async fn get_today_logs() -> Result<Vec<LogEntry>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;

    let now_local = Local::now();
    let midnight_local_now = now_local.date_naive().and_hms_opt(0, 0, 0).unwrap();

    let start_utc = Local
        .from_local_datetime(&midnight_local_now)
        .single()
        .expect("Ambiguous local time due to DST")
        .with_timezone(&Utc);

    let end_utc = Utc::now();

    let logs = sqlx::query_as!(
        LogEntry,
        r#"
        SELECT id, process_name, window_title, 
            start_time as "start_time: chrono::DateTime<chrono::Utc>",
            temp_end_time as "temp_end_time: chrono::DateTime<chrono::Utc>",
            end_time as "end_time?: chrono::DateTime<chrono::Utc>"
        FROM activity_log
        WHERE start_time >= ? AND end_time <= ?
        ORDER BY start_time, end_time DESC
        "#,
        start_utc,
        end_utc
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(logs)
}
