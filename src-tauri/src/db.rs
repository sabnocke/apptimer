use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    Pool, Sqlite,
};

use crate::commands::LogEntry;
use chrono::{DateTime, Utc};
use std::future::Future;
use std::pin::Pin;
use std::{str::FromStr, time::Duration};
use tokio::sync::OnceCell;

pub static DB_CONN: OnceCell<Pool<Sqlite>> = OnceCell::const_new();

#[allow(dead_code)]
#[derive(sqlx::FromRow)]
struct ProcessId {
    id: i64,
}

#[cfg(target_os = "windows")]
#[allow(dead_code)]
fn get_migrate(
    pool: &Pool<Sqlite>,
) -> Box<dyn Fn() -> Pin<Box<dyn Future<Output=()> + Send>> + Send> {
    Box::new(move || {
        let pool = pool.clone();
        Box::pin(async move {
            sqlx::migrate!(".\\migrations")
                .run(&pool)
                .await
                .expect("Migration failed");
        })
    })
}

#[cfg(not(target_os = "windows"))]
#[allow(dead_code)]
fn get_migrate(
    pool: &Pool<Sqlite>,
) -> Box<dyn Fn() -> Pin<Box<dyn Future<Output=()> + Send>> + Send + '_> {
    Box::new(move || {
        let pool = pool.clone();
        Box::pin(async move {
            sqlx::migrate!("./migrations")
                .run(&pool)
                .await
                .expect("Migration failed");
        })
    })
}

#[allow(dead_code)]
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
/*pub async fn sync_fallback(/*handle: AppHandle*/) -> Result<LogEntry, String> {
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
    .await
    .map_err(|e| format!("sync_fallback: {}", e));

    updated_entry
}*/

#[allow(dead_code)]
pub async fn log_switch(process_name: &str, title: &str) -> Result<(LogEntry, LogEntry), String> {
    let now = Utc::now();

    let pool = DB_CONN.get().expect("Failed to get db connection");

    /* let _ = sqlx::query!(
        "INSERT OR IGNORE INTO processes (name) VALUES (?)",
        process_name,
    )
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?; */

    /* let record: ProcessId = sqlx::query_as!(
        ProcessId,
        "SELECT id as 'id!' FROM processes WHERE name = ?",
        process_name
    )
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?; */

    let record = sqlx::query_as!(
        ProcessId,
        r#"
        INSERT INTO processes (name)
        VALUES (?)
        ON CONFLICT(name) DO UPDATE SET name = name
        RETURNING id;
        "#,
        process_name
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;


    //? This can fail (first entry of the day)
    let unresolved_update = sqlx::query_as!(
        LogEntry,
        r#"
        UPDATE events
        SET end_time = ?
        WHERE end_time IS NULL
        RETURNING
            id as "id!",
            (SELECT name FROM processes WHERE processes.id = events.process_id) as "process_name!",
            window_title as "window_title!",
            start_time as "start_time: DateTime<Utc>",
            temp_end_time as "temp_end_time: DateTime<Utc>",
            end_time as "end_time: DateTime<Utc>"
        "#,
        now
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("log_switch::update error/warning: {}", e.to_string()));

    let end_time: Option<DateTime<Utc>> = None;
    let insert = sqlx::query_as!(
        LogEntry,
        r#"
        INSERT INTO events (process_id, window_title, start_time, temp_end_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        RETURNING
                id,
                (SELECT name FROM processes WHERE processes.id = events.process_id) as "process_name!",
                window_title,
                start_time as "start_time: DateTime<Utc>",
                temp_end_time as "temp_end_time: DateTime<Utc>",
                end_time as "end_time?: DateTime<Utc>"
        "#,
        record.id,
        title,
        now,
        now,
        end_time,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("log_switch::insert error/warning: {}", e.to_string()))?;


    let update = match unresolved_update {
        Ok(data) => {
            data.unwrap_or(LogEntry::default())
        },
        Err(e) => {
            println!("{}", e);
            LogEntry::default()
        }
    };

    Ok((update, insert))
}
