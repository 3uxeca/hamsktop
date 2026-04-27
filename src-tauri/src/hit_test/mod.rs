// Adaptive hit-test loop. Polls the global cursor at 2fps when far from the
// sprite (outside 2x bounding box) and at 30fps when close. Toggles
// `set_ignore_cursor_events` only when the opaque/transparent state changes
// to avoid IPC spam. Listens for the frontend's `animation:frame-changed`
// event to know which frame's alpha mask to query.

pub mod alpha_mask;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use mouse_position::mouse_position::Mouse;
use serde::Deserialize;
use tauri::{AppHandle, Listener, Manager};

use alpha_mask::{MaskRegistry, Stage};

const SPRITE_LOGICAL_SIZE: f64 = 32.0; // matches manifest frameSize
const SPRITE_DISPLAY_SCALE: f64 = 3.0; // matches HamsterSprite.tsx SCALE
const FAR_POLL_MS: u64 = 500; // 2 fps
const NEAR_POLL_MS: u64 = 33; // ~30 fps

#[derive(Debug, Deserialize)]
struct FrameChangedPayload {
    stage: String,
    frame: usize,
}

/// Locate the alpha-mask directory. In `cargo tauri dev` the binary runs from
/// `src-tauri/target/...` so we walk up to project root via `CARGO_MANIFEST_DIR`
/// at compile time. For packaged builds (Milestone E) this should switch to
/// `app.path().resource_dir()` once the masks are bundled — a TODO for now.
fn resolve_mask_dir() -> PathBuf {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    PathBuf::from(manifest_dir)
        .parent()
        .map(|p| p.join("src/assets/alpha_masks"))
        .unwrap_or_else(|| PathBuf::from("src/assets/alpha_masks"))
}

pub fn spawn(app: &AppHandle) {
    let mask_dir = resolve_mask_dir();
    println!("[hit_test] loading masks from {}", mask_dir.display());
    let registry = Arc::new(MaskRegistry::load_from_dir(&mask_dir));

    // Shared state updated by the frame-changed listener and read by the loop.
    let current_stage = Arc::new(AtomicUsize::new(stage_to_idx(Stage::Baby)));
    let current_frame = Arc::new(AtomicUsize::new(0));

    // Subscribe to animation:frame-changed so the loop can pick the right
    // mask layer. Payload: { stage: "baby"|"adult"|"senior", frame: usize }.
    {
        let stage_ref = current_stage.clone();
        let frame_ref = current_frame.clone();
        app.listen_any("animation:frame-changed", move |event| {
            match serde_json::from_str::<FrameChangedPayload>(event.payload()) {
                Ok(p) => {
                    if let Some(s) = Stage::from_str(&p.stage) {
                        stage_ref.store(stage_to_idx(s), Ordering::Relaxed);
                    }
                    frame_ref.store(p.frame, Ordering::Relaxed);
                }
                Err(e) => {
                    eprintln!("[hit_test] bad frame-changed payload: {e}");
                }
            }
        });
    }

    let app_handle = app.clone();
    let registry_for_task = registry.clone();
    let stage_for_task = current_stage.clone();
    let frame_for_task = current_frame.clone();
    let last_opaque = Arc::new(AtomicBool::new(false));

    tauri::async_runtime::spawn(async move {
        loop {
            let sleep_ms =
                tick(&app_handle, &registry_for_task, &stage_for_task, &frame_for_task, &last_opaque);
            tokio::time::sleep(Duration::from_millis(sleep_ms)).await;
        }
    });
}

fn tick(
    app: &AppHandle,
    registry: &MaskRegistry,
    stage_idx: &AtomicUsize,
    frame_idx: &AtomicUsize,
    last_opaque: &AtomicBool,
) -> u64 {
    let Some(window) = app.get_webview_window("main") else {
        return FAR_POLL_MS;
    };

    // Read window position & DPI in physical pixels.
    let win_pos = match window.outer_position() {
        Ok(p) => p,
        Err(_) => return FAR_POLL_MS,
    };
    let scale = window.scale_factor().unwrap_or(1.0);

    // Read global cursor (physical px on macOS/Windows).
    let cursor = match Mouse::get_mouse_position() {
        Mouse::Position { x, y } => (x as f64, y as f64),
        Mouse::Error => return FAR_POLL_MS,
    };

    // Convert cursor relative to window in *logical* pixels.
    let rel_phys_x = cursor.0 - win_pos.x as f64;
    let rel_phys_y = cursor.1 - win_pos.y as f64;
    let rel_log_x = rel_phys_x / scale;
    let rel_log_y = rel_phys_y / scale;

    // Sprite is centered in the 128x128 window at display scale (96x96 visible).
    let display_size = SPRITE_LOGICAL_SIZE * SPRITE_DISPLAY_SCALE; // 96
    let win_log_w = window.inner_size().map(|s| s.width as f64 / scale).unwrap_or(128.0);
    let win_log_h = window.inner_size().map(|s| s.height as f64 / scale).unwrap_or(128.0);
    let sprite_left = (win_log_w - display_size) / 2.0;
    let sprite_top = (win_log_h - display_size) / 2.0;

    // Cursor relative to the sprite display rect, scaled back to 32x32 logical.
    let sprite_rel_log_x = rel_log_x - sprite_left;
    let sprite_rel_log_y = rel_log_y - sprite_top;
    let mask_x = (sprite_rel_log_x / SPRITE_DISPLAY_SCALE).floor() as i32;
    let mask_y = (sprite_rel_log_y / SPRITE_DISPLAY_SCALE).floor() as i32;

    // Slow-zone check: 2x bounding box around the sprite display rect.
    let slow_left = sprite_left - display_size / 2.0;
    let slow_top = sprite_top - display_size / 2.0;
    let slow_right = sprite_left + display_size + display_size / 2.0;
    let slow_bottom = sprite_top + display_size + display_size / 2.0;
    let in_slow_zone = rel_log_x >= slow_left
        && rel_log_x <= slow_right
        && rel_log_y >= slow_top
        && rel_log_y <= slow_bottom;

    if !in_slow_zone {
        // Cursor is way outside the window (or far from sprite center) -> ensure
        // click-through is ON so transparent frame doesn't capture clicks, then
        // poll slowly.
        ensure_state(&window, false, last_opaque);
        return FAR_POLL_MS;
    }

    // Inside 2x box -> sample the alpha mask at current frame.
    let stage = idx_to_stage(stage_idx.load(Ordering::Relaxed));
    let frame = frame_idx.load(Ordering::Relaxed);
    let opaque = registry.is_opaque(stage, frame, mask_x, mask_y);
    ensure_state(&window, opaque, last_opaque);
    NEAR_POLL_MS
}

fn ensure_state(window: &tauri::WebviewWindow, opaque: bool, last_opaque: &AtomicBool) {
    let prev = last_opaque.load(Ordering::Relaxed);
    if prev == opaque {
        return;
    }
    last_opaque.store(opaque, Ordering::Relaxed);
    // opaque -> capture clicks (ignore = false). transparent -> click-through (ignore = true).
    let ignore = !opaque;
    if let Err(e) = window.set_ignore_cursor_events(ignore) {
        eprintln!("[hit_test] set_ignore_cursor_events({ignore}) failed: {e}");
    }
}

fn stage_to_idx(s: Stage) -> usize {
    match s {
        Stage::Baby => 0,
        Stage::Adult => 1,
        Stage::Senior => 2,
    }
}

fn idx_to_stage(i: usize) -> Stage {
    match i {
        1 => Stage::Adult,
        2 => Stage::Senior,
        _ => Stage::Baby,
    }
}
