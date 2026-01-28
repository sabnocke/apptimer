use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    Pool, Sqlite,
};

use crate::commands::LogEntry;
use chrono::{DateTime, Local, TimeZone, Utc};
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

pub async fn get_today_events_count() -> Result<i64, String> {
    let pool = DB_CONN.get_or_init(init_db).await;

    let now_local = Local::now();
    let midnight_local_now = now_local
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap();

    let start_utc = Local
        .from_local_datetime(&midnight_local_now)
        .single()
        .expect("Ambiguous local time due to DST")
        .with_timezone(&Utc);

    let end_utc = Utc::now();

    let result: (i64,) = sqlx::query_as(r#"
            SELECT COUNT(*) FROM events
            WHERE start_time >= ? AND end_time <= ?
        "#)
        .bind(start_utc)
        .bind(end_utc)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.0)
}

#[allow(dead_code)]
pub async fn log_switch(process_name: &str, title: &str) -> Result<(LogEntry, LogEntry), String> {
    let now = Utc::now();

    let pool = DB_CONN.get().expect("Failed to get db connection");

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

    match get_today_events_count().await {
        Ok(count) => {println!("- today events count: {}", count)}
        Err(e) => println!("- error while getting today events count: {}", e),
    }

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
#[allow(dead_code)]
pub async fn final_store() {
    let today = Utc::now()
        .date_naive()
        .and_hms_opt(0, 0, 0).unwrap()
        .and_utc();

    let now = Utc::now();

    let pool = DB_CONN.get_or_init(init_db).await;

    let q = sqlx::query!(
            r#"
            UPDATE events
            SET end_time = ?, temp_end_time = ?
            WHERE end_time IS NULL
            "#,
            now,
            now
        ).execute(pool).await;

    match q {
        Ok(r) => println!("Closed {} dangling sessions", r.rows_affected()),
        Err(e) => println!("Failed to update db sessions: {}", e),
    }
}

pub async fn load_steam_game_data(app_id: u32) -> Option<String> {
    let pool = DB_CONN.get().expect("Failed to get db connection");
    let name = format!("steam_app_{}", app_id);

    sqlx::query!(
        "SELECT display_name FROM app_dictionary WHERE process_key = ?",
        name
    )
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map(|d| d.display_name)
        .flatten()
}
