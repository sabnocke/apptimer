use tokio::process::Command;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

use crate::db;
use crate::db::log_switch;
use super::{LAST_NAME, LAST_TITLE};

#[derive(Clone, Debug, serde::Serialize)]
pub struct WindowInfo {
    pub process_name: String,
    pub title: String
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

    Some(WindowInfo { process_name: process, title })
}

/*static LAST_NAME: LazyLock<ArcSwap<String>> = LazyLock::new(|| {
    ArcSwap::from_pointee(String::new());
});

static LAST_TITLE: LazyLock<ArcSwap<String>> = LazyLock::new(|| {
    ArcSwap::from_pointee(String::new())
});
static POOL: LazyLock<Pool<Sqlite>> = LazyLock::new(|| {
    db::init_db().await.expect("failed to init db");
});*/


pub async fn get_process_info(handle: &AppHandle) {
    let last_name = LAST_NAME.load();
    let last_title = LAST_TITLE.load();

    let default = (String::default(), String::default());


    if let Some(window) = get_kde_active_window().await {
        if **last_name != window.process_name || **last_title != window.title {
            println!("Switch! {} -> {}", last_name, window.process_name);

            match log_switch(&window.process_name, &window.title).await {
                Ok(entries) => {
                    let updates = vec![entries.0, entries.1];
                    let _ = handle.emit("activity_change", updates);
                }
                Err(e) => println!("Error: {}", e),
            }

            /*if let Err(e) = db::log_switch(&window.process_name, &window.title).await {
                eprintln!("DB Error: {}", e);
            }
            
            let _ = handle.emit("activity_change", &window);*/
            
            
            LAST_NAME.store(Arc::new(window.process_name));
            LAST_TITLE.store(Arc::new(window.title));
        }
    }
}

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