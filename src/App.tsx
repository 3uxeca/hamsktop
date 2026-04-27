// B.3 shell: hosts the canvas sprite and the click-to-open ActionMenu. The
// Rust hit-test loop toggles `set_ignore_cursor_events`, so click events here
// only fire when the cursor is over an opaque sprite pixel — except while the
// menu is open, in which case we tell Rust (via set_menu_open) to force the
// window into capture mode so menu buttons actually receive their click.
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { HamsterSprite } from "./components/HamsterSprite";
import { ActionMenu, type ActionKind } from "./components/ActionMenu";

const inTauri =
  typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

const FLASH_COLORS: Record<ActionKind, string> = {
  feed: "rgba(255, 220, 80, 0.55)", // yellow
  pet: "rgba(255, 130, 180, 0.55)", // pink
  play: "rgba(120, 170, 255, 0.55)", // blue
};

const FLASH_DURATION_MS = 200;
const TOAST_DURATION_MS = 1800;

export default function App() {
  const [menuOpen, setMenuOpenState] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Single source of truth for menu state: update React + tell Rust so the
  // hit-test loop knows to skip click-through toggling while menu is open.
  const setMenuOpen = useCallback((next: boolean) => {
    setMenuOpenState(next);
    void invoke("set_menu_open", { open: next }).catch((e) =>
      console.warn("[menu] set_menu_open invoke failed:", e)
    );
  }, []);

  // Hotkey safety-net feedback: Rust emits `hotkey:safety-fired` when the user
  // presses Cmd+Shift+H (macOS) / Ctrl+Shift+H (others). Show a brief toast so
  // the user can see something actually happened.
  useEffect(() => {
    if (!inTauri) return;
    let unlisten: UnlistenFn | undefined;
    void listen<string>("hotkey:safety-fired", (event) => {
      setToast(event.payload || "click-through OFF");
      setMenuOpenState(false); // also clear menu state to match Rust
      window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  if (!inTauri) {
    return (
      <div className="dev-warning">
        WARNING: Not running inside the Tauri webview. Open the Tauri window
        instead of this browser tab — <code>invoke()</code> calls will fail
        here.
      </div>
    );
  }

  const handleStageClick = (e: React.MouseEvent) => {
    // Stop bubbling so clicks on action buttons don't reopen the menu.
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleAction = (action: ActionKind) => {
    console.log(`[action] ${action}`);
    setMenuOpen(false);
    setFlash(FLASH_COLORS[action]);
    window.setTimeout(() => setFlash(null), FLASH_DURATION_MS);
  };

  return (
    <div className="hamster-stage" onClick={handleStageClick}>
      <div className="hamster-wrap">
        <HamsterSprite />
        {flash && (
          <div className="hamster-flash" style={{ background: flash }} />
        )}
      </div>
      <ActionMenu
        open={menuOpen}
        onAction={handleAction}
        onClose={() => setMenuOpen(false)}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
