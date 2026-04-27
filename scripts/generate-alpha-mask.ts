// Build-time alpha mask generator. Reads each placeholder sprite sheet (32x256
// = 8 rows of 32x32 frames) and emits a per-stage JSON file at
// src/assets/alpha_masks/{stage}_mask.json. Each frame is encoded as a packed
// hex bit string (32 bits per row, 8 hex chars per row, 32 rows = 256 hex
// chars per frame). Picked over a raw bool[][] because: (a) ~12 KB per file
// vs ~64 KB, (b) trivial parse in Rust via u32::from_str_radix on each row.
//
// Threshold: alpha >= 128 -> opaque. The Rust hit-test loader in B.3 reads
// these files at startup and queries `is_opaque(stage, frame, x, y)`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";

const FRAME_SIZE = 32;
const ROWS = 8;
const ALPHA_THRESHOLD = 128;

interface MaskFile {
  stage: string;
  width: number;
  height: number;
  threshold: number;
  // Each frame is an array of 32 hex strings (one per scanline).
  // hex-string bit i (LSB) corresponds to pixel x = i; bit 31 = pixel x = 31.
  frames: string[][];
}

function rowToHex(bits: boolean[]): string {
  let acc = 0;
  for (let x = 0; x < FRAME_SIZE; x++) {
    if (bits[x]) acc |= 1 << x;
  }
  // Force unsigned 32-bit before hex.
  const u = acc >>> 0;
  return u.toString(16).padStart(8, "0");
}

function buildMask(stage: string, png: PNG): MaskFile {
  if (png.width !== FRAME_SIZE || png.height !== FRAME_SIZE * ROWS) {
    throw new Error(
      `${stage}: expected ${FRAME_SIZE}x${FRAME_SIZE * ROWS}, got ${png.width}x${png.height}`
    );
  }
  const frames: string[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const rows: string[] = [];
    for (let y = 0; y < FRAME_SIZE; y++) {
      const bits: boolean[] = new Array(FRAME_SIZE).fill(false);
      const py = row * FRAME_SIZE + y;
      for (let x = 0; x < FRAME_SIZE; x++) {
        const idx = (py * png.width + x) * 4;
        const alpha = png.data[idx + 3];
        bits[x] = alpha >= ALPHA_THRESHOLD;
      }
      rows.push(rowToHex(bits));
    }
    frames.push(rows);
  }
  return {
    stage,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    threshold: ALPHA_THRESHOLD,
    frames,
  };
}

function main(): void {
  const cwd = process.cwd();
  const inDir = resolve(cwd, "src/assets/placeholders");
  const outDir = resolve(cwd, "src/assets/alpha_masks");
  mkdirSync(outDir, { recursive: true });

  const stages = ["baby", "adult", "senior"];
  for (const stage of stages) {
    const inPath = resolve(inDir, `${stage}.png`);
    const buf = readFileSync(inPath);
    const png = PNG.sync.read(buf);
    const mask = buildMask(stage, png);
    const outPath = resolve(outDir, `${stage}_mask.json`);
    writeFileSync(outPath, JSON.stringify(mask) + "\n");
    console.log(
      `wrote ${outPath} (${mask.frames.length} frames, threshold=${mask.threshold})`
    );
  }
  console.log(`OK — ${stages.length} mask files generated`);
}

main();
