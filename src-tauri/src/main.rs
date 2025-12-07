// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tracker;
mod db;
mod windows;
mod os_utils;


use sqlx::{Pool, Sqlite};
use tauri::{Emitter, Manager};
use tokio::time::{sleep, Duration};
// use crate::windows::get_process;
// async fn linux_tracking_loop(
//     pool: &Pool<Sqlite>,
//     last_process: String,
//     last_title: String,
// ) -> (String, String) {
//     if let Some(window) = tracker::get_kde_active_window().await {
//         if window.process_name != last_process  || window.title != last_title {
//             println!("Switch! {} -> {}", last_process, window.process_name);
//
//             if let Err(e) = db::log_switch(&pool, &window.process_name, &window.title).await {
//                 eprintln!("DB Error: {}", e);
//             }
//
//             let _ = handle.emit("activity_change", &window);
//
//             (window.process_name, window.title)
//         }
//     }
// }

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let pool = db::init_db().await.expect("Failed to get db pool");

                let mut last_process = String::new();
                let mut last_title = String::new();

                loop {
                    // last_process, last_title = linux_tracking_loop(pool, last_process, last_title).await;
                    get_process();
                    sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    // apptimer_lib::run()
}
