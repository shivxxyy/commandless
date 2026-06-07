// Render crisp 1920x1080 title/end cards for the demo video (on-brand black+green).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "video", "frames");
const ICON = join(ROOT, "public", "app-icon.png");
const W = 1920, H = 1080;

const bg = `
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="#0c1a12"/>
      <stop offset="60%" stop-color="#070a09"/>
      <stop offset="100%" stop-color="#050706"/>
    </radialGradient>
    <linearGradient id="green" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3fc07d"/>
      <stop offset="100%" stop-color="#27a35f"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
`;

async function render(name, innerSvg, iconY) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${bg}${innerSvg}
  </svg>`;
  const icon = await sharp(ICON).resize(180, 180).toBuffer();
  await sharp(Buffer.from(svg))
    .composite([{ input: icon, top: iconY, left: (W - 180) / 2 }])
    .png()
    .toFile(join(OUT, name));
  console.log("  ✓", name);
}

await sharp({ create: { width: 1, height: 1, channels: 4, background: "#000" } }); // ensure sharp loaded
import("node:fs").then((fs) => fs.mkdirSync(OUT, { recursive: true }));

const title = `
  <text x="${W / 2}" y="640" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
    font-size="96" font-weight="700" letter-spacing="-2">
    <tspan fill="#e6ebe8">Command</tspan><tspan fill="url(#green)">Less</tspan>
  </text>
  <text x="${W / 2}" y="720" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
    font-size="40" font-weight="500" fill="#9aa6a0">Terminal power. No command memorization.</text>
`;

const end = `
  <text x="${W / 2}" y="600" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
    font-size="84" font-weight="700" letter-spacing="-2">
    <tspan fill="#e6ebe8">Command</tspan><tspan fill="url(#green)">Less</tspan>
  </text>
  <text x="${W / 2}" y="678" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
    font-size="38" font-weight="600" fill="#3fc07d">Free for macOS &amp; Windows</text>
  <text x="${W / 2}" y="744" text-anchor="middle" font-family="ui-monospace, Menlo, monospace"
    font-size="34" font-weight="500" fill="#9aa6a0">github.com/shivxxyy/commandless</text>
`;

await render("00-title.png", title, 380);
await render("99-end.png", end, 360);
console.log("cards in", OUT);
