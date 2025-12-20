use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    Pool, Sqlite,
};

use crate::commands::LogEntry;
use chrono::{Utc, DateTime};
use std::{str::FromStr, time::Duration};
use std::future::Future;
use std::pin::Pin;
use tauri::AppHandle;
use tokio::sync::OnceCell;

pub static DB_CONN: OnceCell<Pool<Sqlite>> = OnceCell::const_new();

#[cfg(target_os = "windows")]
fn get_migrate(pool: &Pool<Sqlite>) -> Box<dyn Fn() -> Pin<Box<dyn Future<Output = ()> + Send>> + Send> {
    Box::new(move || {
        let pool = pool.clone();
        Box::pin(async move {
            sqlx::migrate!(".\\migrations").run(&pool).await.expect("Migration failed");
        })
    })
}

#[cfg(not(target_os = "windows"))]
fn get_migrate(pool: &Pool<Sqlite>) -> Box<dyn Fn() -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + '_> {
    Box::new(move || {
        let pool = pool.clone();
        Box::pin(async move {
            sqlx::migrate!("./migrations").run(&pool).await.expect("Migration failed");
        })
    })
}

pub async fn init_db() -> Pool<Sqlite> {
    let db_url = "sqlite://tracker.db";

    DB_CONN
        .get_or_init(|| async {
            let options = SqliteConnectOptions::from_str(db_url)
                .unwrap()
                .create_if_missing(true)
                .journal_mode(SqliteJournalMode::Delete);

            let pool = SqlitePoolOptions::new()
                .max_connections(20)
                .idle_timeout(Duration::from_secs(60))
                .acquire_timeout(Duration::from_secs(5))
                .connect_with(options)
                .await
                .expect("Failed to create db pool");

            get_migrate(&pool)().await;

            pool
        })
        .await
        .clone()
}

/// Intended as a failsafe in case of sudden (and, in fact, any) shutdowns by periodically storing time in temp value
/// this can then be used as an end time, if it doesn't exist
///
/// # Arguments
///
/// * `pool`: the connection to a SQLite database
///
/// returns: Result<bool, Error>
///
pub async fn sync_fallback(/*handle: AppHandle*/) -> Result<LogEntry, String> {
    let now = Utc::now();
    let pool = DB_CONN.get_or_init(|| async { init_db().await }).await;

    let updated_entry = sqlx::query_as!(
        LogEntry,
        r#"
        UPDATE activity_log
        SET temp_end_time = ?
        WHERE end_time IS NULL
        RETURNING
            id,
            window_title,
            process_name,
            start_time as "start_time: DateTime<Utc>",
            temp_end_time as "temp_end_time: DateTime<Utc>",
            end_time as "end_time?: DateTime<Utc>"
        "#,
        now
    )
    .fetch_one(pool)
    .await.map_err(|e| format!("sync_fallback: {}", e));

    updated_entry
}

pub async fn log_switch(
    process_name: &str,
    title: &str,
) -> Result<(LogEntry, LogEntry), String> {
    let now = Utc::now();

    let pool = DB_CONN.get().expect("Failed to get db connection");
    // println!("Debug print");
    let mut updated_entry = LogEntry::default();
    let maybe_entry = sqlx::query_as!(
        LogEntry,
        r#"
        UPDATE activity_log
        SET end_time = ?
        WHERE end_time IS NULL
        RETURNING
            id,
            process_name,
            window_title,
            start_time as "start_time: DateTime<Utc>",
            temp_end_time as "temp_end_time: DateTime<Utc>",
            end_time as "end_time?: DateTime<Utc>"
        "#,
        now
    )
    .fetch_one(pool)
    .await;

    match maybe_entry {
        Ok(entry) => updated_entry = entry,
        Err(e) => {
            println!("Warning: Could not update previous entry (Most likely there wasn't one to update). Error: {}",e);
        }
    }

    // let res = sqlx::query("UPDATE activity_log SET end_time = ? WHERE end_time IS NULL")
    //     .bind(now)
    //     .execute(pool)
    //     .await?;
    // println!("Debug print");
    let end_time: Option<DateTime<Utc>> = None;

    let update_entry_2: LogEntry = sqlx::query_as!(
        LogEntry,
        r#"
        INSERT INTO activity_log (process_name, window_title, start_time, temp_end_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        RETURNING
                id,
                process_name,
                window_title,
                start_time as "start_time: DateTime<Utc>",
                temp_end_time as "temp_end_time: DateTime<Utc>",
                end_time as "end_time?: DateTime<Utc>"
        "#,
        process_name,
        title,
        now,
        now,
        end_time,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("log_switch -> insert: {}", e.to_string()))?;

    // println!("Debug print");
    /*sqlx::query("INSERT INTO activity_log (process_name, window_title, start_time, temp_end_time) VALUES (?, ?, ?, ?)")
    .bind(process_name)
    .bind(title)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;*/

    Ok((updated_entry, update_entry_2))
}
