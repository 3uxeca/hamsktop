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

- [x] **Window appears as transparent overlay** — confirmed by user after enabling `macos-private-api` Cargo feature + `macOSPrivateApi: true` in `tauri.conf.json`. The initial scaffold without these flags rendered the macOS window opaque white.
- [x] **Click "Toggle Click-Through" button** — confirmed by user: toggles to ON, after which the Tauri window correctly stops receiving mouse events (expected — buttons unreachable until restart).
- [x] **Click "Print Cursor Pos" button** — confirmed by user: Rust returns global cursor coordinates (`x=…, y=…`).

The magenta "HIT TARGET" box (bottom-right area of the window) provides a visible opaque region for testing click-capture vs click-through contrast.

### Spike Findings (carry to A.1)

1. **macOS transparent window requires private API** — without `macos-private-api` feature flag on the `tauri` crate AND `macOSPrivateApi: true` under `app` in `tauri.conf.json`, the window is opaque white on macOS even with `transparent: true`. A.1 bootstrap MUST include both. Note: this prevents Mac App Store distribution but is acceptable for v0.1.
2. **Initial click-through state should default to OFF** — starting with `set_ignore_cursor_events(true)` makes the spike unusable (the user can't click their own UI). For Hamsktop the same default applies; click-through gets dynamically toggled by adaptive polling based on cursor position relative to the sprite alpha mask.
3. **No global hot-key escape** — once click-through is ON, there is no recovery without restarting the process. A.1 should register a global shortcut (e.g., `Cmd+Shift+H`) that force-disables click-through, both for development sanity and as a user-facing safety net.
4. **`tauri::generate_context!()` panics if `frontendDist` directory does not exist** — A.1 must run `npm run build` (or arrange a placeholder dist) before the first `cargo check`, or use a config that points `frontendDist` at an always-existing path.
5. **`localhost:1420` browser tab confusion** — Vite dev server is reachable in any browser, but `__TAURI_INTERNALS__` is undefined there, so `invoke()` calls fail. The spike App.tsx now displays an explicit warning when not in a Tauri webview; A.1 should keep the same guard.

## Final Verdict

- **Programmatic**: TAURI-V2-OK (all 3 APIs compile and are correctly wired)
- **Visual**: USER-CONFIRMED (all 3 checks passed after macOS private-api fix)
- **Final**: **PROCEED-WITH-V2** — A.1 bootstrap may begin, applying the 5 findings above

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
