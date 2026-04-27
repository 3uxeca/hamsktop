// Stage shell. The Tauri window is 220x220 transparent always-on-top. From top
// to bottom: ActionMenu (when open), draggable hamster sprite (also click-to-
// open-menu), then three live stat gauges (hunger / happiness / affinity).
//
// data-tauri-drag-region on .hamster-wrap turns the hamster body into a window
// drag handle. Children that need their own clicks (action buttons, gauges)
// must NOT inherit the attribute, which is the default — Tauri only honors
// the attribute on the element that received the mousedown.
//
// The Rust hit-test loop owns click-through toggling; while the menu is open
// we tell Rust (via set_menu_open) to force capture mode so the menu buttons
// actually receive their click instead of falling through.
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { HamsterSprite } from "./components/HamsterSprite";
import { ActionMenu, type ActionKind } from "./components/ActionMenu";
import { StatsGauges } from "./components/StatsGauges";
import { useHamsterStore, type StatKey } from "./store/useHamsterStore";

const inTauri =
  typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

// Each action: which stat it bumps, by how much, the visual reaction class
// applied to the sprite wrapper, and the floating emoji that drifts up.
const ACTION_EFFECTS: Record<
  ActionKind,
  { stat: StatKey; delta: number; reactionClass: string; emoji: string }
> = {
  feed: { stat: "hunger", delta: 22, reactionClass: "react-bounce", emoji: "🌽" },
  pet: { stat: "happiness", delta: 18, reactionClass: "react-wobble", emoji: "💗" },
  play: { stat: "affinity", delta: 16, reactionClass: "react-jump", emoji: "⭐" },
};

const REACTION_DURATION_MS = 600;
const EMOJI_DURATION_MS = 900;
const TOAST_DURATION_MS = 1800;

interface FloatingEmoji {
  id: number;
  symbol: string;
}

export default function App() {
  const [menuOpen, setMenuOpenState] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const emojiIdRef = useRef(0);
  const bumpStat = useHamsterStore((s) => s.bumpStat);

  // Single source of truth for menu state: update React + tell Rust so the
  // hit-test loop knows to skip click-through toggling while menu is open.
  const setMenuOpen = useCallback((next: boolean) => {
    setMenuOpenState(next);
    void invoke("set_menu_open", { open: next }).catch((e) =>
      console.warn("[menu] set_menu_open invoke failed:", e)
    );
  }, []);

  // Hotkey safety-net feedback: Rust emits `hotkey:safety-fired` when the user
  // presses Cmd+Shift+H (macOS) / Ctrl+Shift+H (others). Show a brief toast.
  useEffect(() => {
    if (!inTauri) return;
    let unlisten: UnlistenFn | undefined;
    void listen<string>("hotkey:safety-fired", (event) => {
      setToast(event.payload || "click-through OFF");
      setMenuOpenState(false);
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

  const handleSpriteClick = (e: React.MouseEvent) => {
    // The browser still fires click after a quick mousedown/up even with the
    // drag-region attribute, so the menu still opens on a tap. A real drag
    // moves the window and suppresses the click natively.
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleAction = (action: ActionKind) => {
    const effect = ACTION_EFFECTS[action];
    console.log(`[action] ${action} +${effect.delta} ${effect.stat}`);
    bumpStat(effect.stat, effect.delta);
    setMenuOpen(false);
    setReaction(effect.reactionClass);
    window.setTimeout(() => setReaction(null), REACTION_DURATION_MS);

    const id = ++emojiIdRef.current;
    setEmojis((current) => [...current, { id, symbol: effect.emoji }]);
    window.setTimeout(() => {
      setEmojis((current) => current.filter((emoji) => emoji.id !== id));
    }, EMOJI_DURATION_MS);
  };

  return (
    <div className="hamster-stage">
      <ActionMenu
        open={menuOpen}
        onAction={handleAction}
        onClose={() => setMenuOpen(false)}
      />

      <div
        className={`hamster-wrap${reaction ? ` ${reaction}` : ""}`}
        data-tauri-drag-region
        onClick={handleSpriteClick}
      >
        <HamsterSprite />
        {emojis.map((emoji) => (
          <span key={emoji.id} className="emoji-float">
            {emoji.symbol}
          </span>
        ))}
      </div>

      <StatsGauges />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
