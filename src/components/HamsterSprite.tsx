// Canvas renderer for the hamster sprite. Draws a single 32x32 frame from the
// current stage's sprite sheet, scaled up via CSS transform for visibility.
// Subscribes to spriteEngine and re-paints on frame changes.
import { useEffect, useRef } from "react";
import { spriteEngine, type FrameChange } from "../animation/spriteEngine";

// Vite glob import: ?url returns the resolved asset URL, eager keeps them
// available synchronously so the sheet swap on stage change is instant.
const sheetUrls = import.meta.glob<string>(
  "../assets/placeholders/*.png",
  { eager: true, query: "?url", import: "default" }
);

function resolveSheetUrl(sheetPath: string): string | undefined {
  // sheetPath like "placeholders/baby.png" -> "../assets/placeholders/baby.png"
  const key = `../assets/${sheetPath}`;
  return sheetUrls[key];
}

const SCALE = 3; // 32px logical -> 96px on-screen

export function HamsterSprite() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const lastFrameRef = useRef<FrameChange | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const draw = (frame: FrameChange, img: HTMLImageElement): void => {
      ctx.clearRect(0, 0, frame.frameSize, frame.frameSize);
      const sx = frame.frame * frame.frameSize;
      const sy = frame.row * frame.frameSize;
      ctx.drawImage(
        img,
        sx,
        sy,
        frame.frameSize,
        frame.frameSize,
        0,
        0,
        frame.frameSize,
        frame.frameSize
      );
    };

    const onFrame = (change: FrameChange) => {
      lastFrameRef.current = change;
      const sheetPath = spriteEngine.getSheetPath();
      const url = resolveSheetUrl(sheetPath);
      if (!url) {
        console.warn(`[HamsterSprite] no sheet for ${sheetPath}`);
        return;
      }
      const cache = imageCacheRef.current;
      let img = cache.get(url);
      if (!img) {
        img = new Image();
        img.src = url;
        cache.set(url, img);
        img.onload = () => {
          // Re-draw with the most recent frame once the image is ready.
          const last = lastFrameRef.current;
          if (last) draw(last, img!);
        };
      }
      if (img.complete && img.naturalWidth > 0) {
        draw(change, img);
      }
    };

    const unsubscribe = spriteEngine.subscribe(onFrame);
    spriteEngine.start();

    return () => {
      unsubscribe();
      spriteEngine.stop();
    };
  }, []);

  const frameSize = spriteEngine.getFrameSize();
  return (
    <canvas
      ref={canvasRef}
      width={frameSize}
      height={frameSize}
      className="hamster-canvas"
      style={{
        width: `${frameSize * SCALE}px`,
        height: `${frameSize * SCALE}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
