use std::sync::{Arc, LazyLock, Mutex};
use tauri::{AppHandle, Emitter};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
};

use super::{LAST_NAME, LAST_TITLE};
use crate::db::{log_switch, DB_CONN, log_switch_refresh};
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, RefreshKind, System};

static SYS: LazyLock<Mutex<System>> = LazyLock::new(|| {
    let settings = RefreshKind::default().with_processes(ProcessRefreshKind::default());

    Mutex::new(System::new_with_specifics(settings))
});

#[derive(Debug, Clone, serde::Serialize)]
pub struct WindowInfo {
    pub pid: u32,
    pub window_title: String,
    pub process_name: String,
}

impl WindowInfo {
    pub fn is_empty(&self) -> bool {
        self.window_title.is_empty() && self.process_name.is_empty() && self.pid == 0
    }
}

const EMPTY_WINDOW_INFO: WindowInfo = WindowInfo {
    pid: 0,
    window_title: String::new(),
    process_name: String::new(),
};

pub fn get_active_window() -> WindowInfo {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == std::ptr::null_mut() {
            return EMPTY_WINDOW_INFO;
        }

        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));

        let len = GetWindowTextLengthW(hwnd);
        let window_title = if len > 0 {
            let mut buffer = vec![0u16; (len + 1) as usize];
            GetWindowTextW(hwnd, &mut buffer);
            String::from_utf16_lossy(&buffer[..len as usize])
        } else {
            String::from("Unknown title")
        };

        let process_name = {
            let mut sys = SYS.lock().unwrap();
            sys.refresh_processes(ProcessesToUpdate::All, true);

            match sys.process(Pid::from_u32(pid)) {
                Some(p) => p.name().to_str().unwrap().to_string(),
                None => String::from("Unknown process"),
            }
        };

        WindowInfo {
            pid,
            window_title,
            process_name,
        }
    }
}

pub async fn get_process_info(handle: &AppHandle) {
    let last_name = LAST_NAME.load();
    let last_title = LAST_TITLE.load();

    let wi = get_active_window();

    if wi.pid == 0 || wi.is_empty() {
        return;
    }

    if wi.process_name != **last_name || wi.window_title != **last_title {
        println!("Switch! {} -> {}", last_name, wi.process_name);

        match log_switch(&wi.process_name, &wi.window_title).await {
            Ok(entries) => {
                let updates = vec![entries.0, entries.1];
                println!("entry: {}", updates[0]);
                let _ = handle.emit("activity_change", updates);
            }
            Err(e) => {
                eprintln!("DB Error: {}", e);
            }
        }

        // let _ = handle.emit("activity_change", &wi);

        LAST_TITLE.store(Arc::new(wi.window_title.clone()));
        LAST_NAME.store(Arc::new(wi.process_name.clone()));
    }
}

pub async fn get_process_info_(handle: &AppHandle) {
    let last_name = LAST_NAME.load();
    let last_title = LAST_TITLE.load();

    let wi = get_active_window();

    if wi.pid == 0 || wi.is_empty() {
        return;
    }

    if wi.process_name != **last_name || wi.window_title != **last_title {
        println!("Switch! {} -> {}", last_name, wi.process_name);

        match log_switch_refresh(&wi.process_name, &wi.window_title).await {
            Ok(b) => {
                handle.emit("refresh-source", ());
            },
            Err(e) => println!("DB Error: {}", e)
        }

        LAST_TITLE.store(Arc::new(wi.window_title));
        LAST_NAME.store(Arc::new(wi.process_name));
    }
}
