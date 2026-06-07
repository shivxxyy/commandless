// Produce a clean 1024x1024 app icon PNG (transparent background) for Tauri.
//
// - If the source already has transparency, just trim padding and fit to a
//   square (no corner masking, no color keying).
// - If the source is opaque (white background), trim the border and apply a
//   rounded transparent mask.
//
// Usage: node scripts/make-icon.mjs "/path/to/source.png"

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SRC = process.argv[2];
if (!SRC) {
  console.error("Pass the source image path.");
  process.exit(1);
}
const SIZE = 1024;
const RADIUS = 228;

const meta = await sharp(SRC).metadata();
console.log(`source: ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`);

let pipeline = sharp(SRC)
  .trim()
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

if (!meta.hasAlpha) {
  // Opaque source: clip corners to a rounded rect so they become transparent.
  const art = await pipeline.png().toBuffer();
  const mask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`,
  );
  pipeline = sharp(art).composite([{ input: mask, blend: "dest-in" }]);
}

const dest = join(ROOT, "public", "app-icon.png");
await pipeline.png().toFile(dest);

const { data, info } = await sharp(dest).raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2], info.channels === 4 ? data[i + 3] : 255];
};
console.log(`output corners: TL=${at(2, 2)} center=${at(SIZE >> 1, SIZE >> 1)}`);
console.log(`wrote ${dest}`);
