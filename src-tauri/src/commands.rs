use chrono::{DateTime, Local, TimeZone, Utc};
use std::fmt;
use tauri::command;
use reqwest;
use serde_json::{Value,};
use std::sync::atomic::{AtomicBool, Ordering::SeqCst};
use super::db::{DB_CONN, final_store, load_steam_game_data};


static ALLOW_LOGGING: AtomicBool = AtomicBool::new(true);

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
pub async fn get_logs_delta(now: DateTime<Utc>) -> Result<Vec<LogEntry>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;
    
    let (start_utc, end_utc) = get_start_end_date(now);

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

    println!("- length of fetched logs: {}", logs.len());

    Ok(logs)
}

fn get_start_end_date(date: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let midnight = date.date_naive().and_hms_opt(0, 0, 0).unwrap();
    let start_utc = Local
        .from_local_datetime(&midnight)
        .single()
        .expect("Ambiguous local time due to DST")
        .with_timezone(&Utc);

    let end_utc = if Utc::now().date_naive() == date.date_naive() {
        Utc::now()
    } else {
        let end_ = date.date_naive().and_hms_opt(23, 59, 59).unwrap();
        Utc
            .from_local_datetime(&end_)
            .single()
            .expect("Ambiguous local time due to DST")
            .with_timezone(&Utc)
    };

    (start_utc, end_utc)
}


async fn __get_unique_names(when: DateTime<Utc>) -> Result<Vec<String>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;

    let (start, end) = get_start_end_date(when);

    let result = sqlx::query_scalar::<_, String>(
        r#"
        SELECT DISTINCT(p.name) from processes p
        JOIN events e ON e.process_id = p.id
        WHERE e.start_time >= ? AND e.end_time <= ?
        "#
    )
        .bind(start)
        .bind(end)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(result)

}

#[command]
pub async fn get_unique_names(when: Option<DateTime<Utc>>) -> Result<Vec<String>, String> {
    let pool = DB_CONN.get().ok_or("Failed to get db pool".to_string())?;
    let result = if let Some(some_when) = when {
        __get_unique_names(some_when).await?
    } else {
        sqlx::query_scalar!(
            "SELECT name FROM processes"
        )
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
    };
    Ok(result)
}

#[command]
pub async fn manual_cleanup() {
    final_store().await;
}

#[command]
pub async fn set_logging(enable: bool) -> bool {
    println!("-- [{}]: switch called from backend", Utc::now());
    let was_running = ALLOW_LOGGING.load(SeqCst);

    println!("was: {}, enable: {}", was_running, enable);

    if was_running != enable {
        ALLOW_LOGGING.store(enable, SeqCst);
        if enable {
            println!("Resuming... loop will start new session automatically.");
        } else {
            println!("Pausing...");
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            println!("Closing active session...");

            final_store().await;
        }
    }

    enable
}

#[command]
pub fn check_access() -> bool {
    ALLOW_LOGGING.load(SeqCst)
}

#[derive(serde::Deserialize)]
pub struct SteamResponse {
    #[serde(rename = "data")]
    details: Option<GameDetails>,
    success: bool,
}

#[derive(serde::Deserialize)]
pub struct GameDetails {
    name: String,
}

#[command]
pub async fn fetch_steam_game_data(app_id: u32) -> Option<String> {
    let url = format!("https://store.steampowered.com/api/appdetails?appids={}", app_id);

    let resp = reqwest::get(&url).await.ok()?.json::<Value>().await.ok()?;

    let game_data = resp.get(app_id.to_string())?;

    if game_data.get("success")?.as_bool()? {
        let name = game_data.get("data")?.get("name")?.as_str()?;
        return Some(name.to_string());
    }
    None
}

#[allow(unused)]
#[command]
pub async fn fetch_load_steam_game_data(app_id: u32) -> String {
    let name = load_steam_game_data(app_id).await;
    if name != "" {
        return name;
    }
    if let Some(name) = fetch_steam_game_data(app_id).await {
        return name;
    }

    format!("steam_app_{}", app_id)
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct AppDictionary {
    process_key: String,
    display_name: String,
    icon_data: String,
    category: String,
}
#[allow(unused)]
#[command]
pub async fn load_app_dictionary() -> Vec<AppDictionary> {
    let pool = DB_CONN.get().expect("Failed to get db connection");
    sqlx::query_as!(
        AppDictionary,
        "SELECT * FROM app_dictionary"
    )
        .fetch_all(pool)
        .await
        .unwrap_or_else(|_| vec![])
}

#[command]
pub async fn update_display_name(process_key: String, display_name: String) -> bool {
    let pool = DB_CONN.get().expect("Failed to get db connection");
    let r = sqlx::query!(
        "UPDATE app_dictionary SET display_name = ? WHERE process_key = ?",
        process_key,
        display_name
    )
    .execute(pool)
    .await;

    match r {
        Ok(rows) => rows.rows_affected() > 0,
        Err(_) => false
    }
}