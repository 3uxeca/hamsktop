// B.1 shell: replaces the brown placeholder div with the canvas-based
// HamsterSprite. Keeps the inTauri guard so opening the Vite dev URL in a
// browser still shows a useful warning instead of crashing on `invoke()`.
import { HamsterSprite } from "./components/HamsterSprite";

const inTauri =
  typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

export default function App() {
  if (!inTauri) {
    return (
      <div className="dev-warning">
        WARNING: Not running inside the Tauri webview. Open the Tauri window
        instead of this browser tab — <code>invoke()</code> calls will fail
        here.
      </div>
    );
  }

  return (
    <div className="hamster-stage">
      <HamsterSprite />
    </div>
  );
}
