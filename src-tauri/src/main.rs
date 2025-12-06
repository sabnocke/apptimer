// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tracker;
mod db;


use tauri::{Emitter, Manager};
use tokio::time::{sleep, Duration};


fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let pool = db::init_db().await.expect("Failed to get db pool");

                let mut last_process = String::new();
                let mut last_title = String::new();

                loop {
                    if let Some(window) = tracker::get_kde_active_window().await {
                        if window.process_name != last_process  || window.title != last_title {
                            println!("Switch! {} -> {}", last_process, window.process_name);

                            if let Err(e) = db::log_switch(&pool, &window.process_name, &window.title).await {
                                eprintln!("DB Error: {}", e);
                            }

                            let _ = handle.emit("activity_change", &window);

                            last_process = window.process_name;
                            last_title = window.title;
                        }
                    }
                    sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    // apptimer_lib::run()
}
