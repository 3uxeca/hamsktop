// Generates a 1024x1024 placeholder source icon at scripts/source-icon.png.
// Feed it to `npx tauri icon scripts/source-icon.png` to populate
// src-tauri/icons/ with all platform formats (.ico, .icns, png set).
// Real branded artwork replaces this in Milestone E.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PNG } from "pngjs";

const SIZE = 1024;
const BG = { r: 0, g: 0, b: 0, a: 0 }; // transparent
const BODY = { r: 139, g: 90, b: 43, a: 255 }; // adult-brown
const EYE = { r: 30, g: 20, b: 10, a: 255 };

function fill(png: PNG, r: number, g: number, b: number, a: number): void {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }
}

function disc(png: PNG, cx: number, cy: number, radius: number, c: { r: number; g: number; b: number; a: number }): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
      const idx = (py * png.width + px) * 4;
      png.data[idx] = c.r;
      png.data[idx + 1] = c.g;
      png.data[idx + 2] = c.b;
      png.data[idx + 3] = c.a;
    }
  }
}

function main(): void {
  const png = new PNG({ width: SIZE, height: SIZE });
  fill(png, BG.r, BG.g, BG.b, BG.a);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const bodyR = Math.floor(SIZE * 0.42);
  disc(png, cx, cy, bodyR, BODY);

  // Two simple eyes for character
  const eyeR = Math.floor(SIZE * 0.04);
  const eyeOffsetX = Math.floor(SIZE * 0.13);
  const eyeOffsetY = -Math.floor(SIZE * 0.07);
  disc(png, cx - eyeOffsetX, cy + eyeOffsetY, eyeR, EYE);
  disc(png, cx + eyeOffsetX, cy + eyeOffsetY, eyeR, EYE);

  const out = resolve(process.cwd(), "scripts/source-icon.png");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, PNG.sync.write(png));
  console.log(`wrote ${out} (${SIZE}x${SIZE})`);
}

main();
