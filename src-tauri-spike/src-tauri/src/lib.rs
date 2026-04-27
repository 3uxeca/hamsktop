use mouse_position::mouse_position::Mouse;
use serde::Serialize;
use tauri::{Manager, WebviewWindow};

#[derive(Serialize)]
struct CursorPos {
    x: i32,
    y: i32,
}

fn get_main_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())
}

#[tauri::command]
fn set_click_through(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let win = get_main_window(&app)?;
    win.set_ignore_cursor_events(enabled)
        .map_err(|e| format!("set_ignore_cursor_events failed: {e}"))?;
    println!("[spike] set_ignore_cursor_events({enabled}) -> OK");
    Ok(())
}

#[tauri::command]
fn get_cursor_position() -> Result<CursorPos, String> {
    match Mouse::get_mouse_position() {
        Mouse::Position { x, y } => {
            println!("[spike] get_cursor_position -> ({x}, {y})");
            Ok(CursorPos { x, y })
        }
        Mouse::Error => Err("mouse_position::Mouse::Error".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Start with click-through OFF so the user can actually click the
            // spike's own buttons. Toggling ON is tested via the button.
            if let Some(win) = app.get_webview_window("main") {
                if let Err(e) = win.set_ignore_cursor_events(false) {
                    eprintln!("[spike] initial set_ignore_cursor_events(false) failed: {e}");
                } else {
                    println!("[spike] initial set_ignore_cursor_events(false) -> OK");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_click_through,
            get_cursor_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
