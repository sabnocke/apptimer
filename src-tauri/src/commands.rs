use chrono::{DateTime, Local, TimeZone, Utc};
use std::fmt;
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
        write!(
            f,
            "(id: {}, \n\
        process_name: {}, \n\
        window_title: {}, \n\
        start_time: {}, \n\
        temp_end_time: {}, \n\
        end_time: {:?})",
            self.id,
            self.process_name,
            self.window_title,
            self.start_time,
            self.temp_end_time,
            self.end_time
        )
    }
}

//TODO these might not return entries with end_time == null
/* fn get_date_delta(
    base_date: DateTime<Local>,
    year: i32,
    month: i32,
    day: i32,
) -> Option<DateTime<Local>> {
    let total_months = (year * 12) + month;
    let date_after_months = if total_months >= 0 {
        base_date.checked_add_months(Months::new(total_months as u32))?
    } else {
        base_date.checked_sub_months(Months::new(total_months.abs() as u32))?
    };

    let final_date = if day >= 0 {
        date_after_months.checked_add_signed(Duration::days(day as i64))?
    } else {
        date_after_months.checked_sub_signed(Duration::days(day.abs() as i64))?
    };

    Some(final_date)
} */

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
        SELECT
            e.id as "id!",
            p.name as process_name,
            e.window_title,
            e.start_time as "start_time: chrono::DateTime<chrono::Utc>",
            e.temp_end_time as "temp_end_time: chrono::DateTime<chrono::Utc>",
            e.end_time as "end_time?: chrono::DateTime<chrono::Utc>"
        FROM events e
        JOIN processes p ON e.process_id = p.id
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

#[command]
pub async fn get_logs_delta(now: DateTime<Local>) -> Result<Vec<LogEntry>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;

    let midnight_now = now.date_naive().and_hms_opt(0, 0, 0).unwrap();
    let start_utc = Local
        .from_local_datetime(&midnight_now)
        .single()
        .expect("Ambiguous local time due to DST")
        .with_timezone(&Utc);
    let end_utc = Local::now();

    let logs = sqlx::query_as!(
        LogEntry,
        r#"
        SELECT
            e.id as "id!",
            p.name as process_name,
            e.window_title,
            e.start_time as "start_time: chrono::DateTime<chrono::Utc>",
            e.temp_end_time as "temp_end_time: chrono::DateTime<chrono::Utc>",
            e.end_time as "end_time?: chrono::DateTime<chrono::Utc>"
        FROM events e
        JOIN processes p ON e.process_id = p.id
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

#[command]
pub async fn get_unique_names(when: Option<DateTime<Local>>) -> Result<Vec<String>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;
    let result = if let Some(some_when) = when {
        get_logs_delta(some_when)
        .await?
        .into_iter()
        .map(|item| item.process_name)
        .collect::<Vec<String>>()
    } else {
        sqlx::query_scalar!(
            "SELECT name FROM processes"
        ).fetch_all(pool).await.map_err(|e| e.to_string())?
    };
    Ok(result)
}
