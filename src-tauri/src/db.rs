use sqlx::{query, sqlite::SqlitePoolOptions, Pool, Row, Sqlite};
use std::fs::File;
use std::path::Path;
use chrono;

pub async fn init_db() -> Result<Pool<Sqlite>, sqlx::Error> {
    if !Path::new("tracker.db").exists() {
        File::create("tracker.db")?;
    }

    let pool = SqlitePoolOptions::new()
        .connect("sqlite://tracker.db")
        .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                process_name TEXT NOT NULL,
                window_title TEXT NOT NULL,
                start_time TEXT NOT NULL,
                temp_end_time TEXT NOT NULL,
                end_time TEXT
                )",
    ).execute(&pool).await?;

    Ok(pool)
}
/// Intended as a failsafe in case of sudden (and, in fact, any) shutdowns by periodically storing time in temp value
// this can then be used as an end time, if it doesn't exist
///
/// # Arguments
///
/// * `pool`: the connection to a SQLite database
///
/// returns: Result<bool, Error>
///
pub async fn sync_fallback(pool: &Pool<Sqlite>) -> Result<bool, sqlx::Error> {
    let now = chrono::Local::now().to_rfc3339();

    sqlx::query("UPDATE activity_log SET temp_end_time = ? WHERE end_time IS NULL")
        .bind(now)
        .execute(pool)
        .await?;

    Ok(true)
}

pub async fn log_switch(pool: &Pool<Sqlite>, process_name: &str, title: &str) -> Result<(), sqlx::Error> {
    let now = chrono::Local::now().to_rfc3339();

    sqlx::query("UPDATE activity_log SET end_time = ? WHERE end_time IS NULL")
        .bind(&now)
        .execute(pool)
        .await?;

    sqlx::query("INSERT INTO activity_log (process_name, window_title, start_time) VALUES (?, ?, ?)")
        .bind(process_name)
        .bind(title)
        .bind(&now)
        .execute(pool)
        .await?;

    Ok(())
}