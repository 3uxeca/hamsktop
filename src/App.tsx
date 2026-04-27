// A.1 placeholder shell: renders a 48x48 brown square where the hamster will live.
// All real lifecycle/hit-test/mood logic arrives in milestones B-D.
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
      <div className="hamster-placeholder" aria-label="hamster placeholder" />
    </div>
  );
}
