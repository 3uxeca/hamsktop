// Frame sequencer for the hamster sprite. Drives animation via
// requestAnimationFrame + accumulator vs (1000 / fps). Emits a Tauri event
// `animation:frame-changed` with `{ stage, frame }` ONLY when the displayed
// frame index actually changes (not every rAF tick) so the Rust hit-test loop
// in B.3 can pick the correct alpha-mask layer without IPC spam.
import manifest from "./manifest.json";

export type Stage = "baby" | "adult" | "senior";
export type AnimationName = "idle" | "sleep";

interface AnimationDef {
  row: number;
  frames: number;
  fps: number;
}

interface StageDef {
  sheet: string;
  animations: Record<string, AnimationDef>;
}

interface Manifest {
  frameSize: number;
  rows: number;
  stages: Record<Stage, StageDef>;
}

const MANIFEST = manifest as Manifest;

export interface FrameChange {
  stage: Stage;
  animation: AnimationName;
  row: number;
  frame: number;
  frameSize: number;
}

type Listener = (change: FrameChange) => void;

const inTauri =
  typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

class SpriteEngine {
  private stage: Stage = "baby";
  private animation: AnimationName = "idle";
  private frame = 0;
  private accumulator = 0;
  private lastTimestamp: number | null = null;
  private rafId: number | null = null;
  private listeners = new Set<Listener>();
  private emitter: ((change: FrameChange) => void) | null = null;

  constructor() {
    if (inTauri) {
      // Lazy-load the Tauri event API so browser preview never imports it.
      void import("@tauri-apps/api/event").then(({ emit }) => {
        this.emitter = (change) => {
          void emit("animation:frame-changed", {
            stage: change.stage,
            frame: change.frame,
          });
        };
      });
    }
  }

  start(): void {
    if (this.rafId !== null) return;
    const tick = (ts: number) => {
      this.advance(ts);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
    this.accumulator = 0;
  }

  setStage(stage: Stage): void {
    if (this.stage === stage) return;
    this.stage = stage;
    this.frame = 0;
    this.accumulator = 0;
    this.notify();
  }

  setAnimation(animation: AnimationName): void {
    if (this.animation === animation) return;
    this.animation = animation;
    this.frame = 0;
    this.accumulator = 0;
    this.notify();
  }

  getStage(): Stage {
    return this.stage;
  }

  getAnimation(): AnimationName {
    return this.animation;
  }

  getCurrentDef(): AnimationDef {
    return MANIFEST.stages[this.stage].animations[this.animation];
  }

  getFrameSize(): number {
    return MANIFEST.frameSize;
  }

  getSheetPath(): string {
    return MANIFEST.stages[this.stage].sheet;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Push current state immediately so subscribers can render.
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private advance(ts: number): void {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = ts;
      return;
    }
    const dt = ts - this.lastTimestamp;
    this.lastTimestamp = ts;

    const def = this.getCurrentDef();
    if (def.frames <= 1) {
      // Single-frame animation: nothing to advance.
      return;
    }
    const threshold = 1000 / def.fps;
    this.accumulator += dt;
    if (this.accumulator < threshold) return;

    // Advance one or more frames if the tab was throttled.
    const steps = Math.floor(this.accumulator / threshold);
    this.accumulator -= steps * threshold;
    const next = (this.frame + steps) % def.frames;
    if (next === this.frame) return;
    this.frame = next;
    this.notify();
  }

  private snapshot(): FrameChange {
    const def = this.getCurrentDef();
    return {
      stage: this.stage,
      animation: this.animation,
      row: def.row,
      frame: this.frame,
      frameSize: MANIFEST.frameSize,
    };
  }

  private notify(): void {
    const change = this.snapshot();
    for (const listener of this.listeners) {
      listener(change);
    }
    if (this.emitter) {
      this.emitter(change);
    }
  }
}

export const spriteEngine = new SpriteEngine();
