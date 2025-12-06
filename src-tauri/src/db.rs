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
                end_time TEXT
                )",
    ).execute(&pool).await?;

    Ok(pool)
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