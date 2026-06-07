// Render crisp 1920x1080 scene frames for the demo video — faithful recreations
// of the CommandLess UI (real commands, risk badges, terminal output).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "video", "frames");
mkdirSync(OUT, { recursive: true });
const ICON = join(ROOT, "public", "app-icon.png");
const W = 1920, H = 1080;

const RISK = {
  safe: { label: "Safe", color: "#34c77b" },
  medium: { label: "Medium risk", color: "#d6a23a" },
  dangerous: { label: "Dangerous", color: "#e0625c" },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text, max) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function topBar() {
  return `
    <rect x="0" y="0" width="${W}" height="64" fill="#0a0d0c"/>
    <line x1="0" y1="64" x2="${W}" y2="64" stroke="#ffffff" stroke-opacity="0.06"/>
    <text x="92" y="40" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700">
      <tspan fill="#e6ebe8">Command</tspan><tspan fill="#3fc07d">Less</tspan>
    </text>
    <rect x="240" y="18" width="150" height="30" rx="7" fill="#ffffff" fill-opacity="0.06"/>
    <text x="262" y="38" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#9aa6a0">Terminal 1</text>
    <circle cx="1740" cy="32" r="4" fill="#5f6b65"/><circle cx="1772" cy="32" r="4" fill="#5f6b65"/>
    <circle cx="1804" cy="32" r="4" fill="#5f6b65"/><circle cx="1836" cy="32" r="4" fill="#5f6b65"/>
  `;
}

function terminal(lines) {
  const body = lines
    .map((ln, i) => {
      const y = 150 + i * 38;
      const fill = ln.prompt ? "#5fd394" : ln.dim ? "#6b7488" : "#cfd6d1";
      return `<text x="80" y="${y}" font-family="ui-monospace, Menlo, monospace" font-size="26" fill="${fill}" xml:space="preserve">${esc(ln.t)}</text>`;
    })
    .join("");
  return `
    <rect x="40" y="92" width="${W - 80}" height="660" rx="14" fill="#0b0f0e" stroke="#ffffff" stroke-opacity="0.06"/>
    ${body}
  `;
}

function intentBar(text) {
  return `
    <rect x="480" y="980" width="960" height="64" rx="14" fill="#0c0f0e" stroke="#3fc07d" stroke-opacity="0.4"/>
    <text x="512" y="1020" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#3fc07d">&#8250;</text>
    <text x="548" y="1020" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#e6ebe8">${esc(text)}</text>
    <rect x="1372" y="996" width="48" height="32" rx="9" fill="#27a35f"/>
    <text x="1388" y="1019" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#ffffff">&#8593;</text>
  `;
}

function card(scene) {
  const r = RISK[scene.risk];
  const x = 480, w = 960;
  let y = 470;
  const expl = wrap(scene.explanation, 84);
  const cardH = 250 + expl.length * 30 + (scene.dangerWarning ? 90 : 0);
  y = 940 - cardH - 16; // sit above the intent bar
  const parts = [];
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="14" fill="#11161480" fill-opacity="0.96" stroke="${scene.risk === "dangerous" ? "#e0625c" : "#ffffff"}" stroke-opacity="${scene.risk === "dangerous" ? 0.35 : 0.1}"/>`);
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="14" fill="#0e1211"/>`);
  // header
  parts.push(`<text x="${x + 28}" y="${y + 44}" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#e6ebe8">${esc(scene.title)}</text>`);
  const meta = scene.source === "AI" ? "macOS · ✦ AI" : "macOS · Recipe";
  parts.push(`<text x="${x + 28}" y="${y + 76}" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#5f6b65">${esc(meta)}</text>`);
  // risk badge
  const bw = scene.risk === "medium" ? 150 : 110;
  parts.push(`<rect x="${x + w - bw - 24}" y="${y + 24}" width="${bw}" height="36" rx="8" fill="${r.color}" fill-opacity="0.14" stroke="${r.color}" stroke-opacity="0.4"/>`);
  parts.push(`<text x="${x + w - bw / 2 - 24}" y="${y + 48}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="${r.color}">${r.label}</text>`);
  // command box
  parts.push(`<rect x="${x + 28}" y="${y + 96}" width="${w - 56}" height="56" rx="9" fill="#070a09" stroke="#ffffff" stroke-opacity="0.06"/>`);
  parts.push(`<text x="${x + 44}" y="${y + 131}" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#5f6b65">$</text>`);
  parts.push(`<text x="${x + 70}" y="${y + 131}" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#e6ebe8">${esc(scene.command)}</text>`);
  // explanation
  expl.forEach((ln, i) => {
    parts.push(`<text x="${x + 28}" y="${y + 192 + i * 30}" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#9aa6a0">${esc(ln)}</text>`);
  });
  // danger warning
  if (scene.dangerWarning) {
    const wy = y + 192 + expl.length * 30 + 6;
    parts.push(`<rect x="${x + 28}" y="${wy}" width="${w - 56}" height="64" rx="9" fill="#e0625c" fill-opacity="0.08"/>`);
    wrap(scene.dangerWarning, 88).forEach((ln, i) => {
      parts.push(`<text x="${x + 48}" y="${wy + 28 + i * 26}" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#e0625c">${esc(ln)}</text>`);
    });
  }
  return parts.join("");
}

async function render(name, innerSvg) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="0%" r="80%">
      <stop offset="0%" stop-color="#0c1a12"/><stop offset="55%" stop-color="#070a09"/><stop offset="100%" stop-color="#050706"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${innerSvg}
  </svg>`;
  const icon = await sharp(ICON).resize(36, 36).toBuffer();
  await sharp(Buffer.from(svg))
    .composite([{ input: icon, top: 14, left: 44 }])
    .png()
    .toFile(join(OUT, name));
  console.log("  ✓", name);
}

const P = (t) => ({ t, prompt: true });
const O = (t) => ({ t });
const D = (t) => ({ t, dim: true });

const scenes = [
  {
    name: "01-large.png", intent: "find large files here",
    title: "Find large files", command: "find . -type f -exec du -h {} + | sort -rh | head", risk: "safe", source: "Recipe",
    explanation: "Finds the largest files under the current folder, sorted by size.",
    term: [P("$ find . -type f -exec du -h {} + | sort -rh | head"), O("1.4G   ./assets/raw-capture.mov"), O("612M   ./node_modules/.cache/bundle.js"), O(" 88M   ./design/mockups.fig"), O(" 42M   ./public/demo.gif"), O(" 17M   ./dist/assets/index.js")],
  },
  {
    name: "02-git.png", intent: "show my git changes",
    title: "Show git changes", command: "git status", risk: "safe", source: "Recipe",
    explanation: "Shows which files have changed in the current git repository.",
    term: [P("$ git status"), D("On branch main"), O("Changes not staged for commit:"), O("  modified:   src/App.tsx"), O("  modified:   src/components/IntentBar.tsx"), D("Untracked files:"), O("  video/SCRIPT.md")],
  },
  {
    name: "03-disk.png", intent: "show disk usage",
    title: "Show disk usage", command: "df -h", risk: "safe", source: "Recipe",
    explanation: "Shows how much disk space is used and free on your drives.",
    term: [P("$ df -h"), D("Filesystem      Size    Used   Avail  Capacity"), O("/dev/disk3s1    460Gi   312Gi  148Gi     68%"), O("/dev/disk3s4    460Gi   2.1Gi  148Gi      1%")],
  },
  {
    name: "04-ai.png", intent: "rename all .jpeg files to .jpg",
    title: "Rename .jpeg files to .jpg", command: 'for f in *.jpeg; do mv -- "$f" "${f%.jpeg}.jpg"; done', risk: "medium", source: "AI",
    explanation: "The AI wrote this: loops over every .jpeg file and renames it to .jpg. No recipe needed.",
    term: [P("$ "), D("# describe anything — the AI writes the command")],
  },
  {
    name: "05-danger.png", intent: "kill the process using port 5173",
    title: "Kill process using a port", command: "lsof -ti :5173 | xargs kill -9", risk: "dangerous", source: "Recipe",
    explanation: "Terminates the process listening on the given port.",
    dangerWarning: "Can delete, overwrite, kill processes, or change system settings. Needs typed confirmation — nothing runs without you.",
    term: [P("$ ")],
  },
];

const realterm = `
  ${topBar()}
  ${terminal([P("$ ls -la"), D("drwxr-xr-x   src"), D("drwxr-xr-x   src-tauri"), D("drwxr-xr-x   server"), O("-rw-r--r--   package.json"), O("-rw-r--r--   README.md"), O("-rw-r--r--   tauri.conf.json"), P("$ █")])}
  ${intentBar("Describe what you want to do, or type a command…")}
`;

for (const s of scenes) {
  await render(s.name, `${topBar()}${terminal(s.term)}${card(s)}${intentBar(s.intent)}`);
}
await render("06-realterm.png", realterm);
console.log("scene frames in", OUT);
