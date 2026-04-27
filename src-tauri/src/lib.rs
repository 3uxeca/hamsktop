// Hamsktop library entry. A.1 wires the transparent window, the safety-net
// global hotkey, and stub modules for milestones B-D. Real feature code lives
// inside each module starting in milestone B.

pub mod hit_test;
pub mod hotkey;
pub mod idle;
pub mod lifecycle;
pub mod persistence;

use tauri::{Emitter, Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn get_main_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())
}

/// Frontend tells Rust whether the React-side ActionMenu is open. While true,
/// the hit-test loop forces capture mode so menu buttons receive their click
/// instead of letting it fall through to the app behind. See hit_test/mod.rs.
#[tauri::command]
fn set_menu_open(open: bool) {
    hit_test::set_menu_open(open);
    println!("[menu] set_menu_open({open})");
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
                            // Also clear the menu-open flag so the loop returns
                            // to normal alpha-mask sampling after the rescue.
                            hit_test::set_menu_open(false);
                            if let Err(e) = win.set_ignore_cursor_events(false) {
                                eprintln!("[hotkey] force-disable click-through failed: {e}");
                            } else {
                                println!("[hotkey] safety net fired -> click-through OFF");
                                if let Err(e) =
                                    app.emit("hotkey:safety-fired", "click-through OFF")
                                {
                                    eprintln!("[hotkey] emit safety-fired failed: {e}");
                                }
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![set_menu_open])
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

            // Default placement: bottom-right of the primary monitor with a
            // generous margin so the window clears the macOS Dock / Windows
            // taskbar. Logical pixels keep the math identical across DPI
            // scales; sanity-clamp to the monitor rect so a misconfigured
            // multi-monitor layout cannot shove the window off-screen.
            // Persisted positions (milestone D) will override this.
            if let Some(win) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = win.primary_monitor() {
                    let monitor_size = monitor.size();
                    let monitor_pos = monitor.position();
                    let scale = monitor.scale_factor();
                    let mon_w_log = monitor_size.width as f64 / scale;
                    let mon_h_log = monitor_size.height as f64 / scale;
                    let mon_x_log = monitor_pos.x as f64 / scale;
                    let mon_y_log = monitor_pos.y as f64 / scale;
                    let win_w_log = 220.0;
                    let win_h_log = 220.0;
                    let right_margin = 24.0;
                    #[cfg(target_os = "macos")]
                    let bottom_margin = 90.0; // Dock height-ish
                    #[cfg(not(target_os = "macos"))]
                    let bottom_margin = 60.0; // Windows taskbar height-ish

                    let mut x = mon_x_log + mon_w_log - win_w_log - right_margin;
                    let mut y = mon_y_log + mon_h_log - win_h_log - bottom_margin;
                    // Clamp inside the monitor in case the calculation went
                    // negative (would happen if scale_factor read 0 or the
                    // monitor rect was reported with unexpected units).
                    if x < mon_x_log {
                        x = mon_x_log + 24.0;
                    }
                    if y < mon_y_log {
                        y = mon_y_log + 24.0;
                    }
                    println!(
                        "[setup] monitor ({mon_x_log},{mon_y_log}) {mon_w_log}x{mon_h_log} scale={scale} -> placing at ({x},{y})"
                    );
                    if let Err(e) = win.set_position(tauri::LogicalPosition::new(x, y)) {
                        eprintln!("[setup] set_position bottom-right failed: {e}");
                    }
                } else {
                    eprintln!("[setup] primary_monitor unavailable; using OS default position");
                }
            }

            // Milestone B.3: spawn the adaptive hit-test loop so the window
            // toggles click-through based on alpha-mask sampling.
            hit_test::spawn(app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
