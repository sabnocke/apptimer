use std::sync::{LazyLock, Mutex};
use windows::{
    Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId, GetWindowTextLengthW
    },
};
use tauri::{AppHandle};

use sysinfo::{System, Pid, Process, RefreshKind, ProcessRefreshKind, ProcessesToUpdate};

static SYS: LazyLock<Mutex<System>> = LazyLock::new(|| {
    let settings = RefreshKind::default()
        .with_processes(ProcessRefreshKind::default());

    Mutex::new(System::new_with_specifics(settings))
});

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub pid: u32,
    pub window_title: String,
    pub process_name: String,
}

pub fn get_active_window() -> Option<WindowInfo> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == std::ptr::null_mut() {return None;}

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

        Some(WindowInfo {
            pid,
            window_title,
            process_name,
        })
    }
}

fn format_name<'a>(window_name: &'a str, process_name: &'a str) -> &'a str {
    if process_name.eq("ApplicationFrameHost.exe") {
        return window_name;
    }

    process_name
}


pub fn get_process_info(handle: &AppHandle) {
    let sys = System::new_all();
    let (window_pid, window_title) = get_active_window();

    if window_pid == 0 {
        // idle process
        return;
    }

    let process = sys.processes().get(&Pid::from_u32(window_pid));

    if let Some(process) = process {
        let name = format_name(window_title.as_str(), <&str>::try_from(process.name()).unwrap());
        println!("active process: {}", name);
    }
}