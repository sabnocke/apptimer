use sqlx::{
    Pool, Sqlite,
    sqlite::{ SqliteConnectOptions, SqlitePoolOptions, SqliteJournalMode},
};

use std::{
    fs::{File},
    path::Path,
    str::FromStr,
    time::Duration,
};
use tokio::sync::OnceCell;
use chrono::{Utc};

pub static DB_CONN: OnceCell<Pool<Sqlite>> = OnceCell::const_new();

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

            sqlx::migrate!("./migrations")
                .run(&pool)
                .await
                .expect("Failed to run migrations");

            pool
        })
        .await
        .clone()
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

pub async fn log_switch(process_name: &str, title: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now();

    let pool = match DB_CONN.get() {
        Some(p) => p,
        None => init_db()
    };

    sqlx::query("UPDATE activity_log SET end_time = ? WHERE end_time IS NULL")
        .bind(now)
        .execute(pool)
        .await?;

    sqlx::query("INSERT INTO activity_log (process_name, window_title, start_time) VALUES (?, ?, ?)")
        .bind(process_name)
        .bind(title)
        .bind(now)
        .execute(pool)
        .await?;

    Ok(())
}