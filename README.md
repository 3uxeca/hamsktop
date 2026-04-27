# Hamsktop

Hamsktop is a transparent, always-on-top pixel-art hamster that lives on your desktop and grows alongside your active computer time. v0.1 ships a single-generation lifecycle (baby -> adult -> senior -> farewell over ~80 hours of accumulated active time) with a click-through transparent overlay, OS-level idle detection, three interactions (feed / pet / play), and Korean-only UI. The full plan is at [`.omc/plans/hamsktop-v0.1-consensus.md`](.omc/plans/hamsktop-v0.1-consensus.md).

## Prerequisites

- **Rust** stable (>= 1.95). Install via [rustup](https://rustup.rs).
- **Node.js** 22.x LTS and npm.
- **macOS** (Apple Silicon or Intel) **or Windows 10/11**.
  - On Windows, [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) must be installed (ships with Windows 11; Tauri's bootstrapper installs it on Windows 10 if missing).

## Bootstrap

After cloning, run these in order. The frontend `dist/` must exist before `cargo check` because Tauri's `generate_context!()` panics when `frontendDist` is missing (see `SPIKE-RESULT.md` finding #4):

```sh
npm install
npm run build                                       # produces ../dist for Tauri
cargo check --manifest-path src-tauri/Cargo.toml    # validates Rust side
```

Optional: regenerate placeholder sprite sheets

```sh
npm run gen:placeholders     # writes src/assets/placeholders/{baby,adult,senior}.png
```

## Develop

```sh
npm run tauri dev
```

This starts Vite on `http://localhost:1420` and launches the Tauri webview. The browser tab at that URL will show a warning — `invoke()` only works inside the Tauri window.

If click-through gets stuck ON during development, press **Cmd+Shift+H** (macOS) or **Ctrl+Shift+H** (Windows/Linux) to force-disable it. This is a global hotkey safety net.

## Build installers

```sh
npm run tauri build
```

Outputs platform-specific bundles to `src-tauri/target/release/bundle/`:

- macOS: `.dmg`, `.app`
- Windows: `.msi`, `.exe`

Cross-platform builds are produced by GitHub Actions (`.github/workflows/build.yml`) on every push to `main`. Download artifacts from the Actions tab.

## Test

Backend unit and integration tests:

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

Manual test checklist: `docs/manual-test-checklist.md` (added in milestone D).

## Project structure

```
hamsktop/
  src-tauri/             # Rust: Tauri shell + platform plugins
    src/
      main.rs            # binary entry
      lib.rs             # window setup + global hotkey safety net
      hit_test/          # adaptive cursor polling (milestone B)
      idle/              # macOS IOKit / Windows GetLastInputInfo (milestone C)
      lifecycle/         # life-stage state machine (milestone C)
      persistence/       # JSON state I/O (milestone D)
      hotkey/            # user-configurable hotkeys (milestone B+)
    capabilities/        # Tauri v2 permission files
    tauri.conf.json
    Cargo.toml
  src/                   # TypeScript/React frontend
    main.tsx
    App.tsx
    store/useHamsterStore.ts
    styles/global.css
    assets/placeholders/ # generated 32x256 sprite sheets
  scripts/
    gen-placeholders.ts  # programmatic placeholder PNG generator
  .github/workflows/
    build.yml            # macOS + Windows CI matrix
  src-tauri-spike/       # historical Tauri v2 validation spike (do not modify)
  SPIKE-RESULT.md        # spike findings carried into A.1
  .omc/plans/hamsktop-v0.1-consensus.md   # canonical plan
```

## License

TBD.
