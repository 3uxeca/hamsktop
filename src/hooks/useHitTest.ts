// Subscribes to a Tauri-emitted hit-test state event and exposes a boolean
// for React. The Rust hit-test loop in src-tauri/src/hit_test/mod.rs already
// toggles `set_ignore_cursor_events` directly; this hook is for UI affordances
// (e.g., highlighting the sprite when the cursor is over it). The Rust side
// does not currently emit this event — left as a reserved channel name so the
// frontend doesn't need to change when B.3 wiring is extended in Milestone C.
import { useEffect, useState } from "react";

const inTauri =
  typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

export function useHitTest(): boolean {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    if (!inTauri) return;
    let unlisten: (() => void) | null = null;
    void import("@tauri-apps/api/event").then(({ listen }) =>
      listen<boolean>("hit_test:interactive", (event) => {
        setInteractive(Boolean(event.payload));
      }).then((un) => {
        unlisten = un;
      })
    );
    return () => {
      if (unlisten) unlisten();
    };
  }, []);
  return interactive;
}
