// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
mod os_utils;
mod windows;

use crate::commands::{get_logs_in_range, get_today_logs, get_logs_delta};
use os_utils::get_process_info;
use tokio::time::{sleep, Duration};
use tauri::{
    menu::{Menu, MenuItem, MenuEvent},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent, TrayIcon},
    Manager, RunEvent, WindowEvent, AppHandle, Emitter
};
mod db;



fn menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() { 
        "quit" => app.exit(0),
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        },
        _ => {}
    }
}

fn tray_icon_event(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        ..
    } = event {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(menu_event)
                .on_tray_icon_event(tray_icon_event)
                .build(app)?;

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
            commands::get_today_logs,
            commands::get_logs_delta,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            match event {
                RunEvent::WindowEvent {
                    label,
                    event: WindowEvent::CloseRequested {api, ..},
                    ..
                } => {
                    if label == "main" {
                        // Prevent actual closing
                        api.prevent_close();
                        // Hide instead
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                }
                _ => {}
            }
        });
}
