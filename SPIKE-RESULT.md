# Tauri v2 Spike Result (Milestone A.0)

## Environment

- Date: 2026-04-27
- Host: macOS 26.0.1 (Apple Silicon, aarch64)
- Rust: rustc 1.95.0 (59807616e 2026-04-14)
- Node: v22.21.1
- Tauri crate (resolved): 2.10.3
- tauri-build crate (resolved): 2.5.6
- mouse_position crate (resolved): 0.1.4
- @tauri-apps/api (resolved): 2.10.1
- @tauri-apps/cli (resolved): 2.10.1

## Programmatic Verification (agent-completed)

| API | Status | Evidence |
|-----|--------|----------|
| Window config: `transparent: true`, `decorations: false`, `alwaysOnTop: true` | **PASS** | `src-tauri-spike/src-tauri/tauri.conf.json` lines 19-21: `"transparent": true`, `"decorations": false`, `"alwaysOnTop": true` under `app.windows[0]` |
| `set_click_through` IPC command compiles (`set_ignore_cursor_events`) | **PASS** | `src-tauri-spike/src-tauri/src/lib.rs` line 16-23: `#[tauri::command] fn set_click_through(app, enabled: bool)` calls `win.set_ignore_cursor_events(enabled)`. `cargo check` → exit 0. |
| `get_cursor_position` IPC command compiles (global cursor read while events ignored) | **PASS** | `src-tauri-spike/src-tauri/src/lib.rs` line 25-34: `#[tauri::command] fn get_cursor_position()` uses `mouse_position 0.1.4` crate. `cargo check` → exit 0. |
| React frontend wires both commands via `invoke()` | **PASS** | `src-tauri-spike/src/App.tsx` lines 11 + 22: `invoke("set_click_through", { enabled })` and `invoke("get_cursor_position")` via `@tauri-apps/api/core`. |

**`cargo check` output:**
```
Checking hamsktop-spike v0.0.1 (.../src-tauri-spike/src-tauri)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.61s
```

## Visual Verification (REQUIRES USER)

The following must be confirmed manually. Run from the repo root:

```sh
cd /Users/dasha/Desktop/code/hamsktop/src-tauri-spike
npm run tauri dev
```

A semi-transparent dark panel with two buttons will appear on screen (no title bar, no window chrome).

- [ ] **Window appears as transparent overlay** — no chrome/title bar; desktop and apps behind are visible through transparent areas; window stays on top of all other windows
- [ ] **Click "Toggle Click-Through" button** — toggles click-through ON/OFF. When ON: clicks on the transparent area pass through to apps below. When OFF: the window captures clicks normally. Toggle repeatedly to confirm no crash or leak.
- [ ] **Click "Print Cursor Pos" button** — status line updates with `x=…, y=…` from Rust while click-through is active (events ignored), confirming `mouse_position` crate can read global cursor position independently of `set_ignore_cursor_events` state.

The magenta "HIT TARGET" box (bottom-right area of the window) provides a visible opaque region for testing click-capture vs click-through contrast.

## Final Verdict

- **Programmatic**: TAURI-V2-OK (all 3 APIs compile and are correctly wired)
- **Awaiting**: USER-VISUAL-CONFIRM
- **Provisional**: PROCEED-WITH-V2

## If Visual Fails

If the user reports any visual check failed, the fallback is **Tauri v1** (not Electron). Key A.1 changes required:

| Area | Tauri v2 | Tauri v1 fallback |
|------|----------|-------------------|
| `Cargo.toml` | `tauri = "2"` | `tauri = "1"` |
| Capabilities | `src-tauri/capabilities/*.json` (permission files) | `tauri.conf.json` → `allowlist` block |
| Tray API | `tauri::tray::TrayIconBuilder` | `tauri::SystemTray` |
| `set_ignore_cursor_events` | `window.set_ignore_cursor_events(bool)` | Same signature (unchanged from v1→v2) |
| `mouse_position` crate | `0.1.x` (works on both) | Same |
| Window config keys | `app.windows[*]` in `tauri.conf.json` | `tauri.windows[*]` in `tauri.conf.json` |
| Frontend JS bridge | `@tauri-apps/api/core` → `invoke` | `@tauri-apps/api/tauri` → `invoke` |

WindowPet (https://github.com/SeakMengs/WindowPet) is a working v1 reference implementation using the same transparent + always-on-top + `set_ignore_cursor_events` pattern on macOS/Windows/Linux.
