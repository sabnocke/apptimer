use tokio::process::Command;

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