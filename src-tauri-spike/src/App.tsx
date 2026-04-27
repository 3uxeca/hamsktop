import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const inTauri = typeof (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== "undefined";

export default function App() {
  const [clickThrough, setClickThrough] = useState(false);
  const [status, setStatus] = useState(
    inTauri
      ? "initial: click-through OFF (you can click these buttons)"
      : "WARNING: Not running inside Tauri webview — invoke() will fail. Close this browser tab and use the Tauri popup window only."
  );
  const [cursor, setCursor] = useState<string>("(unknown)");

  async function toggleClickThrough() {
    const next = !clickThrough;
    try {
      await invoke("set_click_through", { enabled: next });
      setClickThrough(next);
      setStatus(`set_ignore_cursor_events(${next}) -> OK. Click-through is now ${next ? "ON" : "OFF"}.`);
    } catch (e) {
      setStatus(`set_ignore_cursor_events FAILED: ${String(e)}`);
    }
  }

  async function readCursor() {
    try {
      const pos = await invoke<{ x: number; y: number }>("get_cursor_position");
      setCursor(`x=${pos.x}, y=${pos.y}`);
      setStatus(`get_cursor_position -> OK (click-through is ${clickThrough ? "ON" : "OFF"})`);
    } catch (e) {
      setCursor("(error)");
      setStatus(`get_cursor_position FAILED: ${String(e)}`);
    }
  }

  return (
    <>
      <div className="spike-panel">
        <h1>Hamsktop Tauri v2 Spike (A.0)</h1>
        <div>Click-through: <strong>{clickThrough ? "ON" : "OFF"}</strong></div>
        <div>Last cursor read: <strong>{cursor}</strong></div>
        <button onClick={toggleClickThrough}>Toggle Click-Through</button>
        <button onClick={readCursor}>Print Cursor Pos</button>
        <div className="status">{status}</div>
      </div>
      <div className="hit-target">HIT TARGET</div>
    </>
  );
}
