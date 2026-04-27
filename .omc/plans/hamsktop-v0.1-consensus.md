# Hamsktop v0.1 Implementation Plan (Consensus)

**Generated:** 2026-04-24
**Source Spec:** `.omc/specs/deep-interview-hamsktop-pixel-hamster.md` (15.3% ambiguity)
**Mode:** RALPLAN-DR Consensus (DELIBERATE -- greenfield cross-platform desktop app)

---

## 1. RALPLAN-DR Summary

### Principles (5)

1. **Always-on transparent HUD is foundational, not optional.** The user explicitly rejected menu-bar/toggle alternatives in contrarian round 4. Every architecture decision must serve a permanently-visible, click-through overlay.
2. **v0.1 ships single-generation lifecycle only.** Multi-generation lineage, breeds, cloud sync are non-goals. Scope discipline is the plan's immune system.
3. **Privacy by design: idle/active signal only.** No keystroke logging, no app-name tracking, no content inspection. The OS idle timer is the sole productivity proxy.
4. **Cross-platform parity is a hard constraint.** macOS and Windows must both build and run from a single codebase. Platform-specific code is isolated behind explicit interfaces.
5. **Resource frugality: <1% idle CPU, always-on viable.** The app runs 24/7. Every rendering and polling decision must justify its budget against this ceiling.

### Decision Drivers (Top 3)

| # | Driver | Weight | Rationale |
|---|--------|--------|-----------|
| 1 | Cross-platform parity over native polish | HIGH | Spec mandates macOS + Windows from single codebase; solo dev cannot maintain two codebases |
| 2 | Dev velocity over resource minimalism (within 1% CPU budget) | HIGH | Solo developer, greenfield, v0.1 = validation. Speed to working prototype matters more than shaving 5 MB off binary, as long as CPU target is met |
| 3 | Proven overlay patterns over novel stacks | MEDIUM | Transparent always-on-top + click-through + pixel hit-test is the hardest triple; pick the stack with the most battle-tested path |

### Viable Options: Tech Stack

#### Option A: Tauri v2 (Rust + WebView) -- RECOMMENDED

| Dimension | Assessment |
|-----------|------------|
| Cross-platform | Single codebase. macOS (WebKit), Windows (WebView2). Proven. |
| Transparent + always-on-top | `tauri.conf.json`: `transparent: true`, `decorations: false`, `alwaysOnTop: true`. Works on both platforms. |
| Click-through / hit-test | `set_ignore_cursor_events(true)` globally, then toggle off when cursor is over opaque sprite pixels. Requires a Rust-side adaptive polling loop (cursor-position check against alpha mask). Pattern proven at the Tauri **v1** level by [WindowPet](https://github.com/SeakMengs/WindowPet) (`tauri = "1.5.4"`, React, ships on macOS/Windows/Linux). **Tauri v2 has API changes** (config schema `allowlist` -> `capabilities`, `SystemTray` -> `tray::TrayIconBuilder`, rewritten plugin system) so the pattern is plausible but not directly proven for v2. A Milestone A validation spike (0.5 day) gates the project on confirming the three critical APIs work on v2. Fallback: Tauri v1 (not Electron). |
| Idle detection | Custom Tauri plugin: Rust FFI to IOKit (`HIDIdleTime`) on macOS, `GetLastInputInfo` on Windows. Straightforward, no Accessibility permission needed for idle-only. |
| Resource footprint | ~8-15 MB RAM, ~5 MB binary. WebView reuses OS renderer. Canvas/sprite animation at 4-8 fps is negligible CPU. |
| Dev velocity | Frontend in TypeScript/React (fast iteration on UI/sprites). Rust only for platform plugins + hit-test loop. |
| Risk | Rust learning curve (mitigated: plugin surface is small). `set_ignore_cursor_events` toggle approach is a known Tauri v1 pattern; v2 validation spike in Milestone A mitigates the API-change risk. If spike fails, Tauri v1 is the fallback (not Electron). |

#### Option B: Electron (Node + Chromium)

| Dimension | Assessment |
|-----------|------------|
| Cross-platform | Single codebase. Mature. |
| Transparent + always-on-top | `BrowserWindow({ transparent: true, frame: false, alwaysOnTop: true })`. Well-documented. |
| Click-through / hit-test | `setIgnoreMouseEvents(true, { forward: true })` + dynamic toggle. Known bugs: [mousemove not firing with certain windows focused (Windows)](https://github.com/electron/electron/issues/33281), [flickering during drag (Windows)](https://github.com/electron/electron/issues/35030). |
| Idle detection | `powerMonitor.getSystemIdleTime()` built-in. Zero extra work. |
| Resource footprint | ~80-150 MB RAM (bundled Chromium). Transparent windows on Windows cause [constant renderer CPU usage](https://github.com/electron/electron/issues/8790). **This directly threatens the <1% idle CPU requirement on Windows.** |
| Dev velocity | Fastest. Pure JS/TS. Enormous ecosystem. |
| Risk | RAM bloat acceptable for v0.1 but CPU issue on Windows transparent windows is a known, unresolved Electron bug that conflicts with core spec requirement. |

**Why Electron loses:** The documented constant-CPU-usage bug with transparent windows on Windows (#8790) directly conflicts with the <1% idle CPU acceptance criterion. This is not a theoretical risk; it is a filed, reproduced, unresolved bug. Electron's idle detection advantage does not compensate.

#### Option C: Native (Swift/AppKit + C#/WinUI)

| Dimension | Assessment |
|-----------|------------|
| Cross-platform | Two separate codebases. Double the work for a solo developer. |
| Performance | Best possible. Zero overhead. |
| Dev velocity | Slowest. Two languages, two build systems, two CI pipelines. |

**Why Native loses:** Driver #1 (cross-platform parity from single codebase) and Driver #2 (dev velocity) both reject this option. Solo developer maintaining Swift + C# is not viable for v0.1.

#### Option D: Flutter Desktop

| Dimension | Assessment |
|-----------|------------|
| Cross-platform | Single codebase. Dart. |
| Transparent + always-on-top + click-through | Requires community plugins (`window_manager`, `desktop_multi_window`). Transparent click-through is plugin-dependent and not first-class. Hit-test control is limited. |
| Maturity | Flutter Desktop is stable but the transparent-overlay-with-click-through niche has far fewer proven examples than Tauri or Electron. |

**Why Flutter loses:** Driver #3 (proven overlay patterns). The transparent + click-through + pixel-hit-test triple lacks mature, battle-tested Flutter implementations. WindowPet proves the pattern works in the Tauri ecosystem (v1); no equivalent Flutter desktop pet exists at comparable maturity.

### DECISION: Tauri v2 (Rust backend + TypeScript/React frontend)

---

## 2. Open Question Decisions

### Q1: Tech Stack Pick
**Decision:** Tauri v2 (Rust + React/TypeScript)
**Driver:** #1 (cross-platform), #3 (proven overlay pattern via WindowPet precedent on Tauri v1; v2 plausible, gated by Milestone A spike), #5 principle (resource frugality -- Tauri's lightweight footprint naturally meets <1% CPU). Fallback: Tauri v1 if v2 spike fails.

### Q2: 1-Generation Real-Time Length
**Decision:** 10 real-time days of accumulated active time
**Justification:** 7 days is too short for emotional attachment to form (user barely finishes naming the pet before it ages). 14 days risks losing engagement if the user has a vacation mid-cycle. 10 days (~80 hours of active computer use at 8h/day) provides a satisfying arc. The lifecycle clock only ticks during active time, so calendar days will stretch longer (realistic: ~12-16 calendar days).

**Stage breakdown (in accumulated active hours):**
- Baby: 0-20h (first ~2.5 active days)
- Adult: 20-60h (next ~5 active days)
- Senior: 60-80h (final ~2.5 active days)
- Death: at 80h accumulated active time

### Q3: Idle Penalty Model
**Decision:** Neutral (sleep mood, no penalty)
**Driver:** v0.1 principle #2 (ship single-generation). Penalty systems need balancing and risk frustrating users who take breaks. In v0.1, idle = hamster sleeps (cute animation). Growth simply pauses. No hunger, no health drain. This is simpler to implement, avoids negative emotional feedback, and aligns with "productivity companion" (not "punishment pet").

### Q4: Explicit Interaction Effects
**Decision:** Three actions with concrete mechanical effects:

| Action | Mood Effect | Growth Effect | Animation |
|--------|------------|---------------|-----------|
| **Feed** | +15 mood (capped at 100) | None | Hamster eats food sprite, cheek pouches puff |
| **Pet (Stroke)** | +25 mood (capped at 100) | None | Hamster closes eyes, heart particles |
| **Play** | +10 mood | +0.5h growth bonus (counts as 30 min active time) | Hamster runs on wheel / bounces ball |

- Mood decays at -5/hour while active, -2/hour while idle.
- **Mood decay across app-closed periods:** On relaunch, retroactive mood decay is computed for the duration `now - last_saved_at` at the **idle rate (-2/h)**, floored at 0. Closed-time decay never uses the active rate, so users are not punished for sleeping or weekends. Example: app closed for 10 hours -> mood drops by 20 points (retroactively applied on load). **Do not apply mood decay to `Dead` stage** -- a dead hamster loaded from persistence must not have its mood further reduced.
- Mood affects idle animation variety (high mood = more playful idle anims, low mood = sluggish).
- Play's growth bonus is capped at 3 uses per real-time day to prevent grinding. The daily reset comparison must use **local time** (`chrono::Local::now().date_naive()`), not UTC, so users in non-UTC timezones get resets at midnight local time.
- Cooldown: each action has a 5-minute cooldown to prevent spam.

### Q5: Sound Effects
**Decision:** Off by default. Mute toggle in settings tray menu (single checkbox). No volume slider in v0.1.
**Justification:** The app runs 24/7 including during meetings. Sound-off default respects the user's work context. Sound assets are still included for users who opt in (click feedback chirps, stage-transition jingle, death melody).

### Q6: UI Language
**Decision:** Korean only (KR) for v0.1
**Justification:** Solo developer, Korean-speaking user. All UI strings (action menu, settings, farewell screen) in Korean. Strings are externalized into a single `i18n/ko.json` file from day 1 so EN can be added in v0.2 without refactoring.

### Q7: Multi-Monitor Policy
**Decision:** Anchor to last-placed monitor. Persist monitor index + (x, y) position. On launch, if the saved monitor is absent, fall back to primary monitor at the same relative (x, y).
**Justification:** Simplest correct behavior. "Follow primary" is confusing when the user explicitly drags the pet to a secondary screen. Persistence across launches is already required by acceptance criterion #8.

### Q8: v0.1 Customize Scope
**Decision:** Name only.
**Justification:** Name is the minimum viable emotional attachment vector. "What's your hamster's name?" on first launch creates ownership. Color/skin systems require multiple sprite sheet variants, which is art pipeline complexity that does not belong in v0.1. The name displays in the farewell screen and (later) lineage.

---

## 3. Architecture

### 3.1 Module / Directory Structure

```
hamsktop/
  src-tauri/                          # Rust backend
    src/
      main.rs                         # Tauri entry point, window setup
      lib.rs                          # Module declarations
      commands/
        mod.rs                        # Command module root
        idle.rs                       # get_idle_seconds() command
        state.rs                      # save_state / load_state commands
        interaction.rs                # feed / pet / play commands
      hit_test/
        mod.rs                        # Adaptive hit-test polling loop (2fps far / 30fps near), DPI normalization, frame-changed event listener
        alpha_mask.rs                 # Alpha mask loader + frame-indexed point-in-rect query
      platform/
        mod.rs                        # Platform trait definitions
        macos/
          mod.rs
          idle.rs                     # IOKit HIDIdleTime query
        windows/
          mod.rs
          idle.rs                     # GetLastInputInfo query
      persistence/
        mod.rs
        schema.rs                     # HamsterState struct + serde
        store.rs                      # Read/write JSON to app data dir
    tauri.conf.json                   # Window config: transparent, frameless, alwaysOnTop
    Cargo.toml
    build.rs

  src/                                # TypeScript/React frontend
    main.tsx                          # React entry point
    App.tsx                           # Root component, routes HUD vs Settings
    components/
      HamsterSprite.tsx               # Canvas-based sprite renderer
      ActionMenu.tsx                  # Feed/Pet/Play radial or dropdown menu
      FarewellScreen.tsx              # Death screen + restart button
      SettingsPanel.tsx               # Name, sound toggle, quit
      OnboardingDialog.tsx            # First-launch name input
    hooks/
      useIdleDetection.ts             # Polls Tauri idle command, updates store
      useLifecycle.ts                 # State machine: baby -> adult -> senior -> dead
      useMood.ts                      # Mood decay + interaction effects
      useHitTest.ts                   # Sends cursor pos to Rust for alpha check
    store/
      hamsterStore.ts                 # Zustand store: HamsterState
      persistMiddleware.ts            # Auto-save to Tauri backend on state change
    assets/
      sprites/                        # Sprite sheet PNGs per life stage (farewell anim is in senior.png per manifest)
        baby.png
        adult.png
        senior.png
        actions/                      # Interaction animation frames
          feed.png
          pet.png
          play.png
      sounds/                         # Optional sound effects
        chirp.wav
        stage_up.wav
        farewell.wav
      alpha_masks/                    # Pre-computed alpha masks for hit-test
        baby_mask.json
        adult_mask.json
        senior_mask.json
    animation/
      spriteEngine.ts                 # Frame sequencer, animation manifest reader
      manifest.json                   # Animation definitions (see 3.4)
    i18n/
      ko.json                         # All UI strings in Korean
    styles/
      global.css                      # Transparent body, no-select, no-scroll

  .github/
    workflows/
      build.yml                       # CI: macOS + Windows build matrix (Milestone A.2)

  scripts/
    generate-alpha-mask.ts            # Build-time: reads sprite PNGs, outputs alpha mask JSON

  .gitignore                            # node_modules, target, dist
  package.json
  tsconfig.json
  vite.config.ts                      # Vite for frontend bundling
```

### 3.2 Cross-Platform Abstraction

The platform boundary is a single Rust trait:

```rust
// src-tauri/src/platform/mod.rs

pub trait IdleDetector: Send + Sync {
    /// Returns seconds since last user input (keyboard/mouse)
    fn get_idle_seconds(&self) -> Result<u64, String>;
}

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;

pub fn create_idle_detector() -> Box<dyn IdleDetector> {
    #[cfg(target_os = "macos")]
    { Box::new(macos::idle::MacOsIdleDetector::new()) }
    #[cfg(target_os = "windows")]
    { Box::new(windows::idle::WindowsIdleDetector::new()) }
}
```

**macOS implementation** (`platform/macos/idle.rs`):
- Uses `IOServiceGetMatchingService` + `IORegistryEntryCreateCFProperty` to read `HIDIdleTime` from IOKit.
- No Accessibility permission needed (HIDIdleTime is unprivileged).
- FFI via `core-foundation` and `io-kit-sys` crates.

**Windows implementation** (`platform/windows/idle.rs`):
- Calls `GetLastInputInfo()` from `winapi`/`windows` crate.
- Computes `(GetTickCount() - lastInputInfo.dwTime) / 1000`.
- No special permissions.

### 3.3 Persistence Schema

**File location:**
- macOS: `~/Library/Application Support/com.hamsktop.app/hamster_state.json`
- Windows: `%APPDATA%\com.hamsktop.app\hamster_state.json`

(Tauri's `app_data_dir()` resolves this automatically.)

**Schema (`hamster_state.json`):**

```json
{
  "version": 1,
  "hamster": {
    "name": "string",
    "generation": 1,
    "born_at": "2026-04-24T10:00:00Z",
    "stage": "baby | adult | senior | dead",
    "accumulated_active_seconds": 0,
    "mood": 100,
    "last_feed_at": "2026-04-24T10:00:00Z | null",
    "last_pet_at": "2026-04-24T10:00:00Z | null",
    "last_play_at": "2026-04-24T10:00:00Z | null",
    "play_count_today": 0,
    "play_count_reset_date": "2026-04-24"
  },
  "window": {
    "x": 100,
    "y": 200,
    "monitor_index": 0
  },
  "settings": {
    "sound_enabled": false,
    "locale": "ko"
  },
  "last_saved_at": "2026-04-24T12:34:56Z"
}
```

**Rust struct (`persistence/schema.rs`):**

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppState {
    pub version: u32,
    pub hamster: HamsterData,
    pub window: WindowPosition,
    pub settings: Settings,
    pub last_saved_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HamsterData {
    pub name: String,
    pub generation: u32,
    pub born_at: DateTime<Utc>,
    pub stage: LifeStage,
    pub accumulated_active_seconds: u64,
    pub mood: f32,                       // 0.0 - 100.0
    pub last_feed_at: Option<DateTime<Utc>>,
    pub last_pet_at: Option<DateTime<Utc>>,
    pub last_play_at: Option<DateTime<Utc>>,
    pub play_count_today: u32,
    pub play_count_reset_date: NaiveDate,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum LifeStage {
    Baby,    // 0 - 72_000s (20h)
    Adult,   // 72_000 - 216_000s (20-60h)
    Senior,  // 216_000 - 288_000s (60-80h)
    Dead,    // >= 288_000s
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WindowPosition {
    pub x: f64,
    pub y: f64,
    pub monitor_index: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Settings {
    pub sound_enabled: bool,
    pub locale: String,
}
```

### 3.4 Asset Pipeline: Animation Manifest

**`src/animation/manifest.json`:**

```json
{
  "sprite_size": { "width": 32, "height": 32 },
  "scale": 3,
  "frame_rate": 6,
  "stages": {
    "baby": {
      "sheet": "sprites/baby.png",
      "alpha_mask": "alpha_masks/baby_mask.json",
      "animations": {
        "idle_happy":   { "row": 0, "frames": 4, "loop": true },
        "idle_neutral": { "row": 1, "frames": 4, "loop": true },
        "idle_sad":     { "row": 2, "frames": 4, "loop": true },
        "sleep":        { "row": 3, "frames": 4, "loop": true },
        "eat":          { "row": 4, "frames": 6, "loop": false },
        "pet":          { "row": 5, "frames": 6, "loop": false },
        "play":         { "row": 6, "frames": 8, "loop": false },
        "stage_up":     { "row": 7, "frames": 8, "loop": false }
      }
    },
    "adult": {
      "sheet": "sprites/adult.png",
      "alpha_mask": "alpha_masks/adult_mask.json",
      "animations": {
        "idle_happy":   { "row": 0, "frames": 4, "loop": true },
        "idle_neutral": { "row": 1, "frames": 4, "loop": true },
        "idle_sad":     { "row": 2, "frames": 4, "loop": true },
        "sleep":        { "row": 3, "frames": 4, "loop": true },
        "eat":          { "row": 4, "frames": 6, "loop": false },
        "pet":          { "row": 5, "frames": 6, "loop": false },
        "play":         { "row": 6, "frames": 8, "loop": false },
        "stage_up":     { "row": 7, "frames": 8, "loop": false }
      }
    },
    "senior": {
      "sheet": "sprites/senior.png",
      "alpha_mask": "alpha_masks/senior_mask.json",
      "animations": {
        "idle_happy":   { "row": 0, "frames": 4, "loop": true },
        "idle_neutral": { "row": 1, "frames": 4, "loop": true },
        "idle_sad":     { "row": 2, "frames": 4, "loop": true },
        "sleep":        { "row": 3, "frames": 4, "loop": true },
        "eat":          { "row": 4, "frames": 6, "loop": false },
        "pet":          { "row": 5, "frames": 6, "loop": false },
        "play":         { "row": 6, "frames": 8, "loop": false },
        "farewell":     { "row": 7, "frames": 12, "loop": false }
      }
    }
  }
}
```

**Alpha mask format (`alpha_masks/baby_mask.json`):**

```json
{
  "width": 32,
  "height": 32,
  "scale": 3,
  "frames": {
    "0": [[3,5,28,30], [2,6,29,31]],
    "1": [[3,5,28,30], [2,6,29,31]]
  }
}
```

Each frame maps to a list of opaque bounding rectangles `[x1, y1, x2, y2]` in unscaled sprite coordinates. The hit-test checks: `is_opaque(cursor_x, cursor_y)` by scaling down cursor coords and testing against the current frame's rectangles. This is an intentional simplification over per-pixel alpha checking -- bounding rects at 32x32 are sufficient for a chunky pixel-art hamster.

**DPI normalization:** On Windows with display scaling (125%, 150%, etc.), OS cursor coordinates are in physical pixels but WebView content renders in logical pixels. All hit-test coordinates must be normalized to **logical pixels**. The Rust hit-test loop divides physical cursor coords by `window.scale_factor()` before comparing against sprite position and alpha mask rects. This ensures correct hit-testing on high-DPI displays on both platforms.

**Frame index IPC:** Rust needs to know which animation frame is currently displayed to select the correct alpha mask. The frontend emits a lightweight Tauri event `animation:frame-changed` with payload `{ "stage": "baby", "frame": 2 }` whenever the displayed sprite frame changes. Rust caches this index and uses it for hit-test lookups. This is **not** per-frame IPC -- events fire only on actual frame transitions (~6 times/second at 6fps animation rate, and only when the animation is running).

**Adaptive polling:** The hit-test loop uses two rates. **Slow mode (2fps):** when the cursor is outside 2x the sprite bounding box (e.g., sprite is 96x96 scaled, slow zone is 192x192 centered on sprite). At 2fps, the loop only checks cursor distance to sprite center. **Fast mode (30fps):** when the cursor enters the 2x zone, the loop switches to 30fps and performs full bounding-rect alpha mask checks. The loop calls `set_ignore_cursor_events` only when the hit-test result **changes** (cursor enters or leaves an opaque region), not every poll cycle.

**Build-time mask generator** (`scripts/generate-alpha-mask.ts`):
- Reads each sprite sheet PNG with `pngjs` (pure JS, no native build dependencies -- preferred over `sharp` for build simplicity)
- For each frame, scans pixels for alpha > 128
- Computes minimal bounding rectangles covering opaque regions
- Writes JSON mask files

---

## 4. Implementation Steps (Milestone Breakdown)

### Milestone A: Skeleton + Tauri v2 Validation Spike (Est. 1.5-2.5 days)

**Goal:** Tauri app launches, transparent always-on-top window appears with a colored rectangle placeholder where the hamster will be. The first 0.5 day is a **validation spike** that gates the rest of the project.

#### A.0: Tauri v2 Validation Spike (0.5 day, GATE)

Before any feature work, validate the three critical APIs on Tauri v2 specifically (WindowPet proves these on v1 only):

1. **Transparent + frameless + always-on-top window** renders correctly on macOS (and Windows if available): `transparent: true`, `decorations: false`, `alwaysOnTop: true` in `tauri.conf.json` produces a visible window with desktop showing through transparent areas.
2. **`set_ignore_cursor_events(true/false)` toggle** works at runtime: calling `window.set_ignore_cursor_events(true)` makes the window click-through; calling `set_ignore_cursor_events(false)` re-captures clicks. Toggle can be called repeatedly without crash or leak.
3. **Cursor position readable from Rust** while cursor events are ignored on the window: using `mouse_position` crate (or equivalent), Rust can poll global cursor coordinates even when the Tauri window has `ignore_cursor_events = true`.

**Spike pass criteria:** All 3 work on macOS. If any fails, investigate for 2 hours max. If unfixable, **fall back to Tauri v1** (not Electron) and adjust `Cargo.toml` / `tauri.conf.json` to v1 conventions (`allowlist` instead of `capabilities`, `SystemTray` instead of `tray::TrayIconBuilder`). Document the decision in a `SPIKE-RESULT.md` at project root.

#### A.1: Project Bootstrap (1-2 days)

**Deliverables:**
- [ ] Tauri v2 project initialized with React + Vite frontend (or v1 if spike failed)
- [ ] `tauri.conf.json` configured: transparent, frameless, alwaysOnTop, initial size 128x128
- [ ] Frontend renders a 96x96 magenta square on a transparent background
- [ ] Window appears on screen, desktop is visible behind transparent areas
- [ ] Window stays on top of all other windows
- [ ] Placeholder sprites created: 3 colored circles with 2-frame blink animations (baby=small green 16px, adult=medium brown 24px, senior=large gray 32px). Each is a single 32x(32x8) sprite sheet. These can be drawn in any pixel editor in ~30 minutes or generated programmatically. This unblocks all subsequent milestones without waiting for final pixel art.

**Files to create:**
1. `package.json` -- React, Vite, Zustand, TypeScript dependencies; devDependencies: `pngjs` (for alpha mask generator script), `@types/pngjs`
2. `tsconfig.json` -- strict TS config
3. `vite.config.ts` -- Vite config with Tauri plugin
4. `src/main.tsx` -- React entry
5. `src/App.tsx` -- renders placeholder square
6. `src/styles/global.css` -- transparent body, overflow hidden, user-select none
7. `src-tauri/Cargo.toml` -- Tauri v2 deps, serde, chrono, mouse_position, platform-conditional deps
8. `src-tauri/tauri.conf.json` -- window config
9. `src-tauri/src/main.rs` -- Tauri builder
10. `src-tauri/src/lib.rs` -- module declarations
11. `src/assets/sprites/baby.png` -- green circle, 2-frame blink, 32x(32x8) sheet
12. `src/assets/sprites/adult.png` -- brown circle, 2-frame blink, 32x(32x8) sheet
13. `src/assets/sprites/senior.png` -- gray circle, 2-frame blink, 32x(32x8) sheet

**Verification:**
```bash
cd /Users/dasha/Desktop/code/hamsktop && npm install && npm run tauri dev
# MANUAL: confirm transparent window with magenta square on top of other windows
# SPIKE: verify set_ignore_cursor_events toggle works (click-through on/off)
# SPIKE: verify mouse_position crate returns cursor coords while events ignored
```

**Acceptance criteria:**
- `npm run tauri dev` launches without errors on macOS
- Window is transparent (desktop visible behind)
- Window is always on top
- Window has no title bar / frame
- Spike: all 3 critical APIs confirmed working (or fallback to v1 documented)

#### A.2: Cross-Platform CI Pipeline (0.5 day)

A solo macOS developer cannot produce Windows `.msi` binaries locally -- `npm run tauri build` on macOS outputs `.dmg` only. Cross-platform builds are handled by GitHub Actions CI from day one so Windows compilation issues surface immediately, not at Milestone E.

**Deliverables:**
- [ ] Git repository initialized (`git init`, `.gitignore` for `node_modules/`, `target/`, `dist/`)
- [ ] `.github/workflows/build.yml` created with macOS + Windows build matrix
- [ ] First push to `main` triggers CI; both runners produce artifacts
- [ ] `.dmg` (macOS) and `.msi` (Windows) downloadable from the Actions tab

**CI workflow (`.github/workflows/build.yml`):**

```yaml
name: Build & Package

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri -> target

      - name: Install frontend dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: --target ${{ matrix.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: hamsktop-${{ matrix.platform }}
          path: |
            src-tauri/target/${{ matrix.target }}/release/bundle/dmg/*.dmg
            src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi
            src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*.exe
          if-no-files-found: warn
```

**Files to create:**
1. `.gitignore` -- node_modules, target, dist
2. `.github/workflows/build.yml` -- CI workflow above

**Verification:**
```bash
git push origin main
# Check GitHub Actions tab: both macOS and Windows jobs should pass
# Download Windows .msi artifact from Actions tab
```

**Acceptance criteria:**
- CI runs on both `macos-latest` and `windows-latest` without failure
- Build artifacts (`.dmg` and `.msi`/`.exe`) are downloadable from the Actions artifacts tab

**Note:** For local rapid iteration on Windows-specific issues, the developer can optionally use UTM (Apple Silicon) or Parallels with Windows 11 ARM. This is not required -- CI is the canonical Windows verification path.

---

### Milestone B: Sprite Rendering + Hit-Test + Interaction (Est. 3-4 days)

**Goal:** Pixel-art hamster renders from sprite sheet, click-through works everywhere except on the hamster body, clicking hamster opens action menu.

**Deliverables:**
- [ ] Canvas-based sprite renderer playing idle animation from sprite sheet
- [ ] Alpha mask generation script produces mask JSON from sprite PNGs
- [ ] Rust adaptive hit-test loop: polls cursor at **2fps when cursor is outside 2x sprite bounding box**, ramps to **30fps when cursor is inside 2x bounding box**. Toggles `set_ignore_cursor_events` only on state change (entering/leaving opaque area). The 2fps slow-poll checks distance to sprite center and switches rate accordingly.
- [ ] Click on hamster body shows action menu (feed/pet/play) in Korean
- [ ] Click on transparent area passes through to underlying window
- [ ] Action buttons trigger placeholder animations (console log + brief color flash)

**Files to create:**
1. `src/components/HamsterSprite.tsx` -- canvas sprite renderer
2. `src/animation/spriteEngine.ts` -- frame sequencer; emits Tauri event `animation:frame-changed` with `{ stage, frame }` payload on each frame transition (for Rust hit-test mask selection)
3. `src/animation/manifest.json` -- animation definitions
4. `src/components/ActionMenu.tsx` -- radial/dropdown menu (KR labels)
5. `src/hooks/useHitTest.ts` -- coordinates with Rust hit-test
6. `src-tauri/src/hit_test/mod.rs` -- adaptive polling loop (2fps far / 30fps near) + cursor check + `animation:frame-changed` event listener (caches current frame index for mask selection) + DPI normalization (divides physical cursor coords by `window.scale_factor()`)
7. `src-tauri/src/hit_test/alpha_mask.rs` -- mask loader, point-in-rect query, frame-indexed lookup
8. `scripts/generate-alpha-mask.ts` -- build-time mask generator
9. `src/assets/alpha_masks/baby_mask.json` -- generated from placeholder sprites created in Milestone A
10. `src/i18n/ko.json` -- Korean strings for action menu

**Verification:**
```bash
npm run tauri dev
# MANUAL: 
# 1. Move cursor over hamster body -> cursor changes, click captures
# 2. Move cursor to transparent area -> click passes through to app behind
# 3. Click hamster -> action menu appears with 먹이/쓰담/놀기
# 4. Click action -> console log confirms action fired
```

**Acceptance criteria:**
- Hamster sprite animates at ~6fps from sprite sheet
- Click-through works on transparent pixels (can click apps behind)
- Click on opaque hamster pixels shows action menu
- Action menu displays three Korean-labeled options

---

### Milestone C: Idle/Active Detection + Growth Loop (Est. 2-3 days)

**Goal:** OS-level idle detection drives hamster growth. Active time accumulates, life stages transition visibly.

**Deliverables:**
- [ ] Platform-specific idle detection: macOS (IOKit) and Windows (GetLastInputInfo)
- [ ] Frontend polls idle status every 10 seconds via Tauri command
- [ ] Active time accumulates in Zustand store
- [ ] Life stage transitions: baby (0-20h) -> adult (20-60h) -> senior (60-80h)
- [ ] Stage transition triggers visual change (different sprite sheet) + animation
- [ ] Mood system: decays over time, affected by interactions
- [ ] Idle state shows sleep animation

**Files to create:**
1. `src-tauri/src/platform/mod.rs` -- IdleDetector trait
2. `src-tauri/src/platform/macos/mod.rs` -- module
3. `src-tauri/src/platform/macos/idle.rs` -- IOKit implementation
4. `src-tauri/src/platform/windows/mod.rs` -- module
5. `src-tauri/src/platform/windows/idle.rs` -- GetLastInputInfo implementation
6. `src-tauri/src/commands/idle.rs` -- `get_idle_seconds` Tauri command
7. `src/hooks/useIdleDetection.ts` -- 10s polling, active/idle state
8. `src/hooks/useLifecycle.ts` -- state machine, stage transitions
9. `src/hooks/useMood.ts` -- mood decay + interaction effects
10. `src/store/hamsterStore.ts` -- Zustand store with full HamsterState

**Files to modify:**
- `src/App.tsx` -- integrate hooks
- `src/components/HamsterSprite.tsx` -- switch sprite sheet by stage, mood-based idle anim
- `src/components/ActionMenu.tsx` -- wire interaction effects (mood, growth bonus)
- `src-tauri/src/main.rs` -- register idle command
- `src-tauri/src/lib.rs` -- add module declarations
- `src-tauri/Cargo.toml` -- add `io-kit-sys`, `core-foundation`, `winapi` deps

**Verification:**
```bash
npm run tauri dev
# MANUAL:
# 1. Observe hamster in baby stage
# 2. Use computer actively for a few minutes -> accumulated time increases (check dev console)
# 3. Step away / lock screen -> hamster switches to sleep animation
# 4. To test stage transitions: temporarily set thresholds to seconds instead of hours
# AUTOMATED:
cargo test --manifest-path src-tauri/Cargo.toml -- --test lifecycle_tests
```

**Acceptance criteria:**
- Idle detection returns correct seconds-since-last-input on macOS
- Active time accumulates only when user is active (idle < threshold)
- Stage transitions occur at correct accumulated-time boundaries
- Sleep animation plays when idle

---

### Milestone D: Lifecycle Completion + Persistence (Est. 2-3 days)

**Goal:** Hamster dies after 80h active time, farewell screen appears, user can restart. State persists across app restarts.

**Deliverables:**
- [ ] Death state triggers farewell screen with hamster name + "다시 시작" button
- [ ] Restart creates fresh hamster (generation increments), prompts for new name
- [ ] Onboarding dialog on very first launch (name input)
- [ ] State auto-saves every 60 seconds + on interaction + on quit
- [ ] State loads on app launch, hamster resumes from saved state
- [ ] Window position persists across launches
- [ ] Interaction cooldowns and daily play cap enforced

**Files to create:**
1. `src/components/FarewellScreen.tsx` -- death screen, name display, restart button
2. `src/components/OnboardingDialog.tsx` -- first-launch name input
3. `src-tauri/src/persistence/mod.rs` -- module
4. `src-tauri/src/persistence/schema.rs` -- AppState struct (see 3.3)
5. `src-tauri/src/persistence/store.rs` -- read/write JSON, app_data_dir resolution
6. `src-tauri/src/commands/state.rs` -- save_state / load_state Tauri commands
7. `src-tauri/src/commands/interaction.rs` -- feed/pet/play with cooldown + cap logic
8. `src/store/persistMiddleware.ts` -- auto-save on state change (debounced)

**Files to modify:**
- `src/App.tsx` -- onboarding flow, farewell screen routing
- `src/store/hamsterStore.ts` -- add persistence integration
- `src/hooks/useLifecycle.ts` -- add Dead state handling
- `src-tauri/src/main.rs` -- register state + interaction commands
- `src-tauri/src/lib.rs` -- add persistence + commands modules

**Verification:**
```bash
npm run tauri dev
# MANUAL:
# 1. First launch -> onboarding name dialog appears
# 2. Enter name -> hamster appears with entered name
# 3. Quit app, relaunch -> hamster is in same state with same name
# 4. Drag pet to different position, quit, relaunch -> position preserved
# 5. Set thresholds to seconds, run through full lifecycle -> death screen appears
# 6. Click 다시 시작 -> new hamster, generation 2, new name prompt
# AUTOMATED:
cargo test --manifest-path src-tauri/Cargo.toml -- --test persistence_tests
```

**Acceptance criteria:**
- State survives app restart (name, stage, accumulated time, position)
- Farewell screen shows hamster's name
- Restart button works, increments generation
- First-launch onboarding collects name before showing hamster

---

### Milestone E: Polish + Packaging (Est. 2-3 days)

**Goal:** Sound effects, settings panel, multi-monitor handling, tray icon, platform packaging.

**Deliverables:**
- [ ] Sound effects play on interaction (if enabled) -- chirp on feed/pet/play, jingle on stage-up, melody on death
- [ ] Settings panel accessible from tray icon (or right-click menu): sound toggle, quit button
- [ ] Tray icon with hamsktop icon + context menu (설정 / 종료)
- [ ] Multi-monitor: pet position anchored to monitor, fallback on missing monitor
- [ ] macOS `.dmg` via local `npm run tauri build`; Windows `.msi`/`.exe` via CI artifacts (GitHub Actions build matrix, set up in Milestone A.2)
- [ ] Download Windows `.msi` from CI artifact, install in Windows VM/machine, verify launch and basic functionality
- [ ] CPU profiling pass: confirm <1% idle CPU on both platforms

**Files to create:**
1. `src/components/SettingsPanel.tsx` -- settings UI (sound toggle, about, quit)
2. `src/hooks/useSound.ts` -- sound effect player, respects settings
3. `src/assets/sounds/chirp.wav` -- interaction sound
4. `src/assets/sounds/stage_up.wav` -- stage transition sound
5. `src/assets/sounds/farewell.wav` -- death melody
6. `src-tauri/icons/` -- app icons for macOS + Windows (Tauri convention)

**Files to modify:**
- `src-tauri/tauri.conf.json` -- add system tray config, bundle identifiers, installer config
- `src-tauri/src/main.rs` -- add tray setup, multi-monitor position restore
- `src/App.tsx` -- integrate settings panel
- `src/store/hamsterStore.ts` -- add sound_enabled to settings
- `src/components/HamsterSprite.tsx` -- trigger sounds on animation events
- `src/i18n/ko.json` -- add settings strings

**Verification:**
```bash
# Build macOS installer locally
npm run tauri build
# Windows installer: download .msi from GitHub Actions artifacts (CI set up in A.2)

# MANUAL (macOS):
# 1. Install .dmg on macOS, run -> pet appears correctly
# 2. Tray icon visible, right-click -> 설정 / 종료
# 3. Toggle sound on -> click pet -> chirp plays
# 4. Connect/disconnect external monitor -> pet stays or falls back correctly

# MANUAL (Windows -- via CI artifact + VM/machine):
# 5. Download .msi from Actions tab, install in Windows VM/machine
# 6. Verify: pet appears, transparent window, always-on-top, click-through, tray icon

# CPU check (reproducible CLI alternative):
# macOS: top -l 5 -pid $(pgrep -f hamsktop) -stats cpu | tail -5
# Windows (PowerShell): Get-Counter '\Process(hamsktop)\% Processor Time' -SampleInterval 2 -MaxSamples 5
# Target: average < 1% across samples
```

**Acceptance criteria:**
- Sound effects play when enabled, silent when disabled
- Tray icon works on both platforms
- Pet survives monitor disconnect gracefully
- macOS `.dmg` builds locally; Windows `.msi` builds via CI (both artifact-downloadable)
- Idle CPU < 1% on both platforms (measured via CLI commands above)

---

## 5. Test Plan (Deliberate Mode)

### 5.1 Unit Tests

| Test Suite | Location | What It Tests |
|-----------|----------|---------------|
| `lifecycle_state_machine` | `src-tauri/tests/lifecycle_tests.rs` | Stage transitions at exact boundaries (0->20h->60h->80h). Edge cases: transition at exact boundary, accumulated time just below/above threshold. |
| `mood_system` | `src-tauri/tests/mood_tests.rs` | Mood decay rates (active vs idle), interaction boosts with caps, mood clamping at 0 and 100. **Includes mood-decay-on-relaunch:** given `last_saved_at` = 10h ago + mood = 80, assert relaunch computes retroactive decay at idle rate (-2/h) -> mood = 60. Given 60h gap + mood = 50, assert floor at 0 (not negative). Given stage = Dead, assert no mood decay applied regardless of gap duration. |
| `interaction_cooldowns` | `src-tauri/tests/interaction_tests.rs` | 5-min cooldown enforcement, daily play cap (3/day), play count reset on date change using **local time** (`chrono::Local::now().date_naive()`), not UTC. Edge case: play at 23:59 local, next play at 00:01 local -> cap resets. |
| `idle_aggregation` | `src-tauri/tests/idle_tests.rs` | Active time accumulation logic: 10s poll intervals, idle threshold (120s default), edge: rapid active/idle switching. |
| `hit_test_sampling` | `src-tauri/tests/hit_test_tests.rs` | Point-in-rect query against alpha mask data. Cases: point inside opaque rect, point in transparent area, point at boundary, point outside sprite bounds. **DPI normalization:** given physical coords (200, 300) at scale_factor 1.5, assert logical coords (133, 200) are used for mask lookup. **Adaptive rate:** assert poll rate is 2fps when cursor distance > 2x bbox, 30fps when inside. |
| `persistence_serde` | `src-tauri/tests/persistence_tests.rs` | Serialize/deserialize AppState round-trip. Schema version migration stub. Missing fields default correctly. |

### 5.2 Integration Tests

| Test | Location | What It Tests |
|------|----------|---------------|
| `persistence_round_trip` | `src-tauri/tests/integration/persistence_integration.rs` | Write AppState to temp dir, read back, assert equality. Test with corrupted file (graceful fallback to default). |
| `idle_api_macos` | `src-tauri/tests/integration/idle_macos.rs` (cfg macos) | Call real IOKit API, assert returns u64 >= 0. Smoke test only (cannot mock system idle). |
| `idle_api_windows` | `src-tauri/tests/integration/idle_windows.rs` (cfg windows) | Call real GetLastInputInfo, assert returns u64 >= 0. |
| `lifecycle_with_persistence` | `src-tauri/tests/integration/lifecycle_persistence.rs` | Run lifecycle from baby to death with mocked time, persist at each stage, reload and verify continuity. |

### 5.3 E2E / Manual Test Script

Maintained as a checklist in `docs/manual-test-checklist.md`:

1. **Fresh install**: Delete app data dir, launch -> onboarding dialog appears
2. **Name entry**: Type name, confirm -> hamster appears with name
3. **Click-through**: Click transparent area -> underlying app receives click
4. **Hit-test**: Click hamster body -> action menu appears
5. **Feed action**: Click 먹이 -> eat animation plays, mood increases
6. **Pet action**: Click 쓰담 -> pet animation plays, mood increases
7. **Play action**: Click 놀기 -> play animation plays, growth bonus logged
8. **Cooldown**: Click same action within 5 min -> action button disabled/grayed
9. **Idle detection**: Lock screen 3+ min -> hamster shows sleep animation
10. **Resume**: Unlock screen -> hamster wakes, resumes idle_happy/neutral/sad
11. **Stage transition**: (use debug time override) baby -> adult -> change in sprite
12. **Death**: senior -> dead -> farewell screen with name
13. **Restart**: Click 다시 시작 -> new name prompt, generation 2
14. **Persistence**: Quit mid-adult, relaunch -> resumes as adult with correct accumulated time
15. **Position persistence**: Drag pet to corner, quit, relaunch -> appears at same position
16. **Multi-monitor**: Move pet to secondary monitor, disconnect it, relaunch -> pet on primary
17. **Sound toggle**: Enable sound in settings -> interactions produce sound
18. **Tray icon**: Right-click tray -> 설정 / 종료 visible and functional
19. **CPU check**: Idle for 5 min, check CPU < 1%. CLI alternative for reproducibility: macOS `top -l 5 -pid $(pgrep -f hamsktop) -stats cpu | tail -5`; Windows PowerShell `Get-Counter '\Process(hamsktop)\% Processor Time' -SampleInterval 2 -MaxSamples 5`. Average across samples must be < 1%.
20. **DPI scaling** (Windows): Set display scaling to 150%, verify hit-test aligns with visual sprite position
21. **Mood decay on relaunch**: Close app, wait 1+ hours, relaunch -> mood should be lower than when closed (by ~2 points/hour)

### 5.4 Observability

| What | Where | Format |
|------|-------|--------|
| Lifecycle transitions | `src-tauri/src/commands/idle.rs` | `tracing::info!("stage_transition: {} -> {}", old, new)` |
| Interaction events | `src-tauri/src/commands/interaction.rs` | `tracing::info!("interaction: {} mood={}", action, new_mood)` |
| Hit-test toggle | `src-tauri/src/hit_test/mod.rs` | `tracing::debug!("cursor_events: ignore={}", ignore)` (debug level, very frequent) |
| Persistence writes | `src-tauri/src/persistence/store.rs` | `tracing::info!("state_saved: stage={} active_h={:.1}", stage, hours)` |
| Errors | All modules | `tracing::error!` with context |
| Log sink | Tauri plugin `tauri-plugin-log` | Writes to `app_log_dir()/hamsktop.log`, rotates at 5MB, keeps 3 files |

All logging is local only. No telemetry is sent anywhere. Logs are for developer debugging.

---

## 6. Acceptance Criteria Mapping

| # | Acceptance Criterion (verbatim from spec) | Milestone | Verification |
|---|------------------------------------------|-----------|-------------|
| 1 | macOS와 Windows에서 모두 빌드 및 실행 (단일 코드베이스 또는 명시적 양 플랫폼 빌드) | A.2 (CI pipeline), E (Windows install verification) | CI build matrix on `macos-latest` + `windows-latest` runners; artifacts downloadable from Actions tab. Windows `.msi` manually installed in VM/machine and launched. |
| 2 | 햄스터가 transparent, always-on-top, frameless 오버레이 창으로 표시됨 | A | Manual: window is transparent, frameless, stays on top |
| 3 | 펫 몸통 영역에서 픽셀-정확 hit-test 동작; 그 외 영역 click-through 동작 | B | Manual: click hamster = captures, click transparent = passes through |
| 4 | 펫 몸통 클릭 시 먹이/쓰다/놀기 액션 메뉴 표시 + 액션별 애니메이션 반응 | B, C | Manual: menu appears, animations play |
| 5 | OS 레벨 idle/active 감지 동작 (active 시간 누적이 햄스터 성장에 반영) | C | Unit tests + manual: active time drives growth |
| 6 | 햄스터가 가시적 라이프 스테이지(아기 -> 성체 -> 노령)를 거쳐감 | C | Unit tests for thresholds + manual visual verification |
| 7 | 노령 후 자연사 -> 작별 화면 + "다시 시작" 버튼으로 새 햄스터 생성 | D | Manual: farewell screen appears, restart works |
| 8 | 펫 상태(나이, 성장 단계, 누적 active 시간 등) 로컬 영속 저장 -> 앱 재시작 후에도 유지 | D | Integration test + manual: quit and relaunch preserves state |
| 9 | 일반 macOS/Windows 머신에서 idle CPU < 1% 달성 | E | CLI: `top -l 5 -pid $(pgrep -f hamsktop) -stats cpu` (macOS) / `Get-Counter '\Process(hamsktop)\% Processor Time'` (Windows). Average < 1% across 5 samples. |
| 10 | 펫이 다중 모니터 환경에서도 의도한 화면에 위치 유지 | E | Manual: multi-monitor test per E2E checklist |

---

## 7. ADR (Architecture Decision Record)

### Decision

**Tech stack:** Tauri v2 (Rust + TypeScript/React + Vite)

**Open question outcomes:**
1. **Tech stack:** Tauri v2
2. **1-gen length:** 10 active days (80 hours accumulated active time)
3. **Idle penalty:** Neutral (sleep only, no penalty)
4. **Interaction effects:** Feed (+15 mood), Pet (+25 mood), Play (+10 mood, +0.5h growth, 3/day cap)
5. **Sound:** Off by default, simple on/off toggle in settings
6. **UI language:** Korean only, strings externalized in `i18n/ko.json`
7. **Multi-monitor:** Anchor to last-placed monitor, fallback to primary
8. **Customize scope:** Name only (entered at birth)

### Drivers

1. **Cross-platform parity** -- macOS + Windows from single codebase is non-negotiable. Eliminates Native option.
2. **<1% idle CPU** -- 24/7 always-on app must be resource-invisible. Eliminates Electron (transparent window CPU bug on Windows).
3. **Proven overlay patterns** -- WindowPet demonstrates the Tauri ecosystem (v1) handles transparent + click-through + always-on-top on all desktop platforms. Tauri v2 is plausible but gated by Milestone A spike; Tauri v1 is the fallback. Eliminates Flutter (no equivalent proven precedent).
4. **Solo dev velocity** -- TypeScript/React frontend for fast UI iteration; Rust only for the thin platform layer (idle detection, hit-test loop, persistence I/O).

### Alternatives Considered

| Option | Why Not |
|--------|---------|
| **Electron** | Transparent window on Windows causes constant CPU usage (#8790), violating acceptance criterion #9. Mouse event forwarding has known bugs (#33281, #35030). |
| **Native (Swift + C#)** | Two codebases for solo developer. Violates velocity driver. Maintenance burden is 2x. |
| **Flutter Desktop** | Transparent + click-through + hit-test is plugin-dependent with no battle-tested desktop pet precedent at WindowPet's maturity level. |

### Why Chosen

Tauri is the only option that satisfies all three hard constraints simultaneously: single codebase for macOS + Windows, sub-1% idle CPU with transparent windows, and a proven implementation path for pixel-accurate click-through overlays. The WindowPet project (Tauri **v1** + React, shipping on three desktop platforms) serves as existence proof that the pattern works in the Tauri ecosystem. Tauri v2 is the target because its plugin/capability system is the actively maintained branch; however, WindowPet's use of v1 means the three critical APIs (`transparent`, `always_on_top`, `set_ignore_cursor_events`) must be validated on v2 in a Milestone A spike (0.5 day). If the spike fails, the project falls back to Tauri v1 (not Electron), accepting the older plugin API surface. The Rust learning curve is bounded because the platform-specific surface is small (~200 lines of FFI for idle detection, ~150 lines for hit-test loop).

### Consequences

**Positive:**
- Small binary (~5MB) and low RAM (~10-15MB) make the app invisible on the system
- WebView reuses OS-provided renderer, no Chromium bundled
- Rust backend with adaptive polling (2fps far / 30fps near) keeps cursor tracking well under CPU budget
- Strong type safety across the full stack (Rust + TypeScript)

**Negative:**
- Rust compilation is slow (~30-60s incremental, 2-5 min clean). Mitigated: frontend hot-reloads independently via Vite.
- Rust FFI for IOKit/WinAPI requires platform-specific knowledge. Mitigated: the surface is small and well-documented.
- WebView2 must be installed on Windows (ships with Windows 11, auto-installs on Windows 10 via Tauri bootstrapper).
- Debugging Rust + WebView interaction is harder than pure-JS Electron. Mitigated: `tracing` + Tauri devtools.
- Tauri v2 is the target but WindowPet precedent is v1 only. Risk of needing to fall back to v1 exists (mitigated by Milestone A spike). If fallback triggers, v1's older plugin API surface adds minor friction but no blocking issues.

### Follow-ups (deliberately punted from v0.1)

- Multi-generation lineage (v1.0): graveyard UI, family tree, trait inheritance
- EN locale support (v0.2): add `i18n/en.json`, auto-detect OS locale
- Color/skin customization (v0.3): multiple sprite sheet variants
- Breeds / evolution system (v1.0+)
- Cloud sync / multi-device (v2.0)
- Menu bar quick-glance widget (v0.3)
- Drag-to-reposition with physics (v0.2): pet slides to resting position
- Linux support (v0.3): Tauri supports it, just not tested/prioritized for v0.1

---

## 8. Pre-Mortem (3 Failure Scenarios)

### Scenario 1: Hit-test polling loop causes >1% CPU

**What happens:** The Rust cursor-position polling, combined with alpha-mask lookups and `set_ignore_cursor_events` toggling, exceeds the 1% CPU budget on older machines.

**Mitigation already in plan:**
- **Adaptive polling rate** is the primary mitigation: 2fps when cursor is far from sprite (>2x bounding box), 30fps only when cursor is near. The loop is expected to be in slow mode the majority of the time (exact ratio depends on user pet placement and cursor patterns), keeping the effective average rate well below 30fps.
- Use bounding-rectangle hit-test (4-8 rect comparisons per check), not per-pixel alpha sampling
- `set_ignore_cursor_events` is only called when the state *changes* (entering/leaving opaque area), not every poll cycle
- Milestone E includes explicit CPU profiling pass. If still over budget, reduce fast-mode to 15fps (still responsive enough for a 96px sprite).

### Scenario 2: Sprite art blocks progress (no pixel artist available)

**What happens:** The developer is not a pixel artist. Creating 3 sprite sheets x 8 animations x 4-8 frames = ~100+ frames of pixel art becomes a weeks-long bottleneck.

**Mitigation already in plan:**
- **Concrete placeholder sprites ship with Milestone A:** 3 colored circles with 2-frame blink animations (baby=small green 16px, adult=medium brown 24px, senior=large gray 32px). Each is a single 32x(32x8) sprite sheet that can be drawn in any pixel editor in ~30 minutes or generated programmatically. These are sufficient to validate all milestones (hit-test, stage transitions, lifecycle completion) without any pixel art dependency.
- The sprite engine is decoupled from art assets via `manifest.json` -- final pixel art can be swapped in at any time without code changes. Only the PNG files and alpha mask JSON change; no code modifications needed.
- Fallback for final art: use AI pixel art generators (DALL-E, Midjourney with pixel-art style prompts at 32x32 resolution) or commission from a pixel artist. The codebase never blocks on art.

### Scenario 3: Tauri v2 `set_ignore_cursor_events` breaks on a platform update

**What happens:** A macOS or Windows OS update changes window event handling, breaking the click-through toggle that is fundamental to the app.

**Mitigation already in plan:**
- The hit-test module is isolated behind a clean interface (`hit_test/mod.rs`). If the toggle API breaks, only this module needs updating.
- WindowPet (active open-source project on Tauri v1 with the same approach) serves as a canary -- if they patch it, we can learn from their fix. Note: WindowPet is on v1 so their fixes may not directly apply to v2, but the underlying OS-level behavior is the same.
- Fallback approach documented: if per-frame toggling breaks, switch to a two-window architecture (one always-click-through background window for the sprite, one small non-transparent action-menu window that appears on click detection via global mouse hook). This is more complex but does not depend on `set_ignore_cursor_events`.

---

## Appendix: Key Library Versions (as of 2026-04)

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `@tauri-apps/cli` | ^2.x | Tauri CLI |
| `@tauri-apps/api` | ^2.x | JS-to-Rust bridge |
| `tauri` (Rust) | 2.x | Core framework |
| `serde` / `serde_json` | 1.x | Serialization |
| `chrono` | 0.4.x | Date/time handling |
| `tracing` | 0.1.x | Structured logging |
| `tauri-plugin-log` | 2.x | Log file output |
| `io-kit-sys` | 0.4.x | macOS IOKit FFI |
| `core-foundation` | 0.10.x | macOS CF types |
| `winapi` | 0.3.x | Windows API FFI |
| `mouse_position` | 0.1.x | Global cursor position polling (works even when window ignores cursor events) |
| React | ^19.x | UI framework |
| Zustand | ^5.x | State management |
| Vite | ^6.x | Frontend bundler |
| TypeScript | ^5.x | Type safety |
| `pngjs` (dev) | ^7.x | Alpha mask generator: reads sprite sheet PNGs (pure JS, no native deps) |
