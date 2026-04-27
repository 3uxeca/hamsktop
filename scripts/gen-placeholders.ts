// Generates 32x256 placeholder sprite sheets (8 rows x 32px) for baby/adult/senior
// using pngjs — pure JS, no native build deps. Each sheet is a 2-frame blink
// (frame 0 eyes-open, frame 1 eyes-closed) on row 0; rows 1-7 are duplicates so
// the manifest's row indices don't crash before real pixel art lands.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PNG } from "pngjs";

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const FRAME_SIZE = 32;
const FRAMES_PER_ROW = 1; // one frame per (row, col); 2-frame anim uses two rows? -> see below
const ROWS = 8;
const SHEET_WIDTH = FRAME_SIZE; // 32 (single column; 2 frames stacked vertically per row pair? Plan says row-based)
const SHEET_HEIGHT = FRAME_SIZE * ROWS; // 256

// Plan's manifest stores frames horizontally per row, but for placeholders we
// only need row 0 to render. Keep sheet 32x(32*8) so row index math works. The
// 2-frame blink alternates by recomputing on row 0 vs row 1 not strictly
// required for A.1 — App.tsx renders a CSS placeholder, not the sheet yet.

interface Spec {
  name: string;
  color: RGBA;
  radius: number; // unscaled radius in pixels
}

const SPECS: Spec[] = [
  { name: "baby", color: { r: 240, g: 222, b: 180, a: 255 }, radius: 8 }, // small ivory/beige
  { name: "adult", color: { r: 139, g: 90, b: 43, a: 255 }, radius: 12 }, // medium brown
  { name: "senior", color: { r: 160, g: 160, b: 160, a: 255 }, radius: 14 }, // large gray
];

function drawCircle(
  png: PNG,
  cx: number,
  cy: number,
  radius: number,
  color: RGBA,
  closedEyes: boolean
): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
        const idx = (py * png.width + px) * 4;
        png.data[idx] = color.r;
        png.data[idx + 1] = color.g;
        png.data[idx + 2] = color.b;
        png.data[idx + 3] = color.a;
      }
    }
  }

  // Two simple eye dots (skip when closedEyes -> draws a thin line instead).
  const eyeOffsetX = Math.max(2, Math.floor(radius / 3));
  const eyeOffsetY = -Math.max(1, Math.floor(radius / 4));
  for (const sx of [-eyeOffsetX, eyeOffsetX]) {
    const ex = cx + sx;
    const ey = cy + eyeOffsetY;
    if (closedEyes) {
      // horizontal 3px line
      for (let i = -1; i <= 1; i++) {
        const idx = (ey * png.width + (ex + i)) * 4;
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 255;
      }
    } else {
      const idx = (ey * png.width + ex) * 4;
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 255;
    }
  }
}

function buildSheet(spec: Spec): PNG {
  const png = new PNG({ width: SHEET_WIDTH, height: SHEET_HEIGHT });
  // initialize fully transparent
  png.data.fill(0);

  // For each of the 8 rows, draw the blob centered. Row 3 (sleep) draws
  // closed eyes; all others draw open eyes. This is the bare minimum for
  // A.1; real pixel art replaces this entirely later.
  for (let row = 0; row < ROWS; row++) {
    const cx = Math.floor(SHEET_WIDTH / 2);
    const cy = row * FRAME_SIZE + Math.floor(FRAME_SIZE / 2);
    const closedEyes = row === 3; // sleep row
    drawCircle(png, cx, cy, spec.radius, spec.color, closedEyes);
  }
  return png;
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function main(): void {
  const outDir = resolve(process.cwd(), "src/assets/placeholders");
  for (const spec of SPECS) {
    const sheet = buildSheet(spec);
    const buffer = PNG.sync.write(sheet);
    const out = resolve(outDir, `${spec.name}.png`);
    ensureDir(out);
    writeFileSync(out, buffer);
    console.log(`wrote ${out} (${SHEET_WIDTH}x${SHEET_HEIGHT}, ${spec.color.r},${spec.color.g},${spec.color.b})`);
  }
  console.log(`OK — ${FRAMES_PER_ROW} frame/row, ${ROWS} rows, ${SPECS.length} sheets`);
}

main();
