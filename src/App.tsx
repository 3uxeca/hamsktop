// B.3 shell: hosts the canvas sprite and the click-to-open ActionMenu. The
// Rust hit-test loop toggles `set_ignore_cursor_events`, so click events here
// only fire when the cursor is over an opaque sprite pixel.
import { useState } from "react";
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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

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
    setMenuOpen((open) => !open);
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
    </div>
  );
}
