//! CommandLess Tauri backend entry point.
//!
//! Responsibilities live in submodules:
//! - `pty`: real PTY sessions (one per terminal tab), streamed to the UI.
//! - `sys`: host OS / shell info for the recipe and risk engines.
//!
//! Settings, history, and recipe persistence are handled on the frontend via
//! the Tauri filesystem-backed store; the backend stays focused on the PTY.

mod pty;
mod sys;

use pty::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(PtyManager::default())
        .invoke_handler(tauri::generate_handler![
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_close,
            sys::get_os_info,
            sys::get_default_shell,
            sys::get_home_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CommandLess");
}
