// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod windows;
mod os_utils;
mod commands;

use tauri::Emitter;
use commands::{get_today_logs, get_logs_in_range};
mod db;

use os_utils::get_process_info;
use tokio::time::{sleep, Duration};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            let handle_b = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                db::init_db().await;

                loop {
                    get_process_info(&handle).await;
                    sleep(Duration::from_secs(1)).await;
                }
            });

            tauri::async_runtime::spawn(async move {
                loop {
                    // db::sync_fallback().await.expect("error with sync");
                    match db::sync_fallback().await {
                        Ok(entry) => {
                            let _ = handle_b.emit("activity_change", vec![&entry]);
                        }
                        Err(e) => {
                            eprintln!("{}", e)
                        }
                    };
                    sleep(Duration::from_secs(5)).await;
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_logs_in_range,
            commands::get_today_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    // apptimer_lib::run()
}
