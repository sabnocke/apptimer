use chrono::{Local, Utc};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::process::Command;

use super::{LAST_NAME, LAST_TITLE};
use crate::db::{log_switch, log_switch_refresh};

#[derive(Clone, Debug, serde::Serialize)]
pub struct WindowInfo {
    pub process_name: String,
    pub title: String,
}

pub async fn get_kde_active_window() -> Option<WindowInfo> {
    let output_id = Command::new("kdotool")
        .arg("getactivewindow")
        .output()
        .await
        .ok()?;

    if output_id.stdout.is_empty() {
        return None;
    }

    let window_id = String::from_utf8(output_id.stdout).ok()?.trim().to_string();

    let future_name = Command::new("kdotool")
        .arg("getwindowname")
        .arg(&window_id)
        .output();

    let future_class = Command::new("kdotool")
        .arg("getwindowclassname")
        .arg(&window_id)
        .output();

    let (output_name, output_class) = tokio::join!(future_name, future_class);

    let title_bytes = output_name.ok()?.stdout;
    let class_bytes = output_class.ok()?.stdout;

    let title = String::from_utf8(title_bytes)
        .unwrap_or_default()
        .trim()
        .to_string();
    let process = String::from_utf8(class_bytes)
        .unwrap_or_default()
        .trim()
        .to_string();

    Some(WindowInfo {
        process_name: process,
        title,
    })
}

pub async fn get_process_info(handle: &AppHandle) {
    let last_name = LAST_NAME.load();
    let last_title = LAST_TITLE.load();

    if let Some(window) = get_kde_active_window().await {
        if **last_name != window.process_name || **last_title != window.title {
            println!(
                "Switch! {} -> {} | UTC: {} , Local: {}",
                last_name,
                window.process_name,
                Utc::now(),
                Local::now()
            );

            match log_switch(&window.process_name, &window.title).await {
                Ok(entries) => {
                    let updates = vec![entries.0, entries.1];
                    let _ = handle.emit("activity_change", updates);
                }
                Err(e) => println!("Error: {}", e),
            }

            LAST_NAME.store(Arc::new(window.process_name));
            LAST_TITLE.store(Arc::new(window.title));
        }
    }
}

pub async fn get_process_info_(handle: &AppHandle) {
    let last_name = LAST_NAME.load();
    let last_title = LAST_TITLE.load();

    if let Some(window) = get_kde_active_window().await {
        if **last_name != window.process_name || **last_title != window.title {
            println!(
                "Switch! {} -> {} | UTC: {}, Local: {}",
                last_name, window.process_name,
                Utc::now(),
                Local::now()
            );

            match log_switch_refresh(&window.process_name, &window.title).await {
                Ok(_b) => {
                    _ = handle.emit("refresh-source", ());
                },
                Err(e) => println!("Error: {}", e)
            }

            LAST_NAME.store(Arc::new(window.process_name));
            LAST_TITLE.store(Arc::new(window.title));
        }
    }
}