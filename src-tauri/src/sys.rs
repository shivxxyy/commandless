//! Small host-info helpers exposed to the frontend so the recipe engine and
//! risk engine can target the correct OS and shell.

use serde::Serialize;

#[derive(Serialize)]
pub struct OsInfo {
    pub os: String,
    pub shell: String,
    pub home: Option<String>,
}

#[tauri::command]
pub fn get_os_info() -> OsInfo {
    let os = if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else {
        "linux"
    }
    .to_string();

    let shell = default_shell_name();
    let home = dirs_home();

    OsInfo { os, shell, home }
}

#[tauri::command]
pub fn get_default_shell() -> String {
    default_shell_name()
}

#[tauri::command]
pub fn get_home_dir() -> Option<String> {
    dirs_home()
}

fn default_shell_name() -> String {
    #[cfg(target_os = "windows")]
    {
        "powershell".to_string()
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("SHELL")
            .ok()
            .and_then(|s| s.rsplit('/').next().map(|x| x.to_string()))
            .unwrap_or_else(|| "zsh".to_string())
    }
}

fn dirs_home() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE").ok()
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME").ok()
    }
}
