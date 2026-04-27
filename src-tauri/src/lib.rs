// Hamsktop library entry. A.1 wires the transparent window, the safety-net
// global hotkey, and stub modules for milestones B-D. Real feature code lives
// inside each module starting in milestone B.

pub mod hit_test;
pub mod hotkey;
pub mod idle;
pub mod lifecycle;
pub mod persistence;

use tauri::{Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn get_main_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Safety-net hotkey: Cmd+Shift+H on macOS, Ctrl+Shift+H on Windows/Linux.
    #[cfg(target_os = "macos")]
    let safety_modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let safety_modifiers = Modifiers::CONTROL | Modifiers::SHIFT;
    let safety_shortcut = Shortcut::new(Some(safety_modifiers), Code::KeyH);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if shortcut == &safety_shortcut && event.state() == ShortcutState::Pressed {
                        if let Ok(win) = get_main_window(app) {
                            if let Err(e) = win.set_ignore_cursor_events(false) {
                                eprintln!("[hotkey] force-disable click-through failed: {e}");
                            } else {
                                println!("[hotkey] safety net fired -> click-through OFF");
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(move |app| {
            // Spike finding #2: start with click-through OFF so the window is
            // immediately interactive. Adaptive hit-test (milestone B) flips it
            // ON/OFF based on cursor vs sprite alpha mask.
            if let Some(win) = app.get_webview_window("main") {
                if let Err(e) = win.set_ignore_cursor_events(false) {
                    eprintln!("[setup] initial set_ignore_cursor_events(false) failed: {e}");
                }
            }

            // Spike finding #3: register safety-net hotkey to recover from a
            // stuck click-through state.
            if let Err(e) = app.global_shortcut().register(safety_shortcut) {
                eprintln!("[setup] register safety-net shortcut failed: {e}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
