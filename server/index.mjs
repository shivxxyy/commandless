// CommandLess AI proxy
// -------------------------------------------------------------------------
// A tiny, dependency-free backend that holds your Ollama Cloud API key
// SERVER-SIDE and exposes the contract the desktop app expects:
//
//   POST /api/ai/command   { system, intent, context } -> { text }
//   POST /api/ai/explain   { output, context }         -> { title, ... }
//   GET  /health                                       -> { ok: true }
//
// The desktop app calls this via VITE_AI_PROXY_URL. The key never reaches
// the app or the repo — it lives only in server/.env (gitignored).
//
// Run:  npm run proxy   (after creating server/.env from server/.env.example)

import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- minimal .env loader (no dotenv dependency) ---------------------------
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file — rely on real environment variables.
  }
}
loadEnv();

const PORT = Number(process.env.PORT || 8787);
const OLLAMA_HOST = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/$/, "");
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
// Comma-separated list of allowed origins, or "*" for any (dev default).
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
// Optional shared app token. When set, requests must send a matching
// `x-commandless-token` header. Ships baked into the desktop app — it only
// deters casual abuse (combine with rate limits), it is not a real secret.
const APP_TOKEN = process.env.APP_TOKEN || "";
// Abuse / cost guards.
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN || 15); // per IP
const DAILY_CAP = Number(process.env.DAILY_CAP || 1500); // global model calls/day

if (!OLLAMA_API_KEY) {
  console.warn(
    "[commandless-proxy] WARNING: OLLAMA_API_KEY is not set. " +
      "Create server/.env from server/.env.example and add your key.",
  );
}

// --- in-memory rate limiting (single instance) ---------------------------
const ipHits = new Map(); // ip -> { count, resetAt }
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/** Returns null if allowed, or an error string if the request is limited. */
function checkLimits(req) {
  const now = Date.now();
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
  }
  if (dailyCount >= DAILY_CAP) {
    return "Daily usage cap reached. Try again tomorrow.";
  }
  const ip = clientIp(req);
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + 60_000 });
  } else if (entry.count >= RATE_PER_MIN) {
    return "Too many requests. Please slow down.";
  } else {
    entry.count += 1;
  }
  return null;
}

const EXPLAIN_SYSTEM = `You explain shell command errors clearly for CommandLess. Return strict JSON only, no markdown, matching:
{ "title": "string", "whatHappened": "string", "likelyCause": "string", "suggestedFix": "string", "safeCommand": "string" }
Keep it concise and plain-English. safeCommand may be an empty string if not applicable.`;

/** Call the Ollama Cloud chat API and return the assistant's text content. */
async function ollamaChat({ messages }) {
  if (!OLLAMA_API_KEY) {
    throw new Error("Server is missing OLLAMA_API_KEY.");
  }
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      // Ask the model to emit JSON; the app parses it defensively too.
      format: "json",
      options: { temperature: 0.2 },
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Ollama Cloud error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  dailyCount += 1; // count billable model calls toward the daily cap
  return data?.message?.content ?? "";
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }

  const url = (req.url || "").split("?")[0];

  if (req.method === "GET" && url === "/health") {
    send(res, 200, { ok: true, model: OLLAMA_MODEL, hasKey: !!OLLAMA_API_KEY });
    return;
  }

  // Gate the AI endpoints with the app token + rate limits.
  if (url.startsWith("/api/ai/")) {
    if (APP_TOKEN && req.headers["x-commandless-token"] !== APP_TOKEN) {
      send(res, 401, { error: "Unauthorized" });
      return;
    }
    const limited = checkLimits(req);
    if (limited) {
      send(res, 429, { error: limited });
      return;
    }
  }

  try {
    if (req.method === "POST" && url === "/api/ai/command") {
      const { system, intent, context } = await readBody(req);
      const started = Date.now();
      const history = Array.isArray(context?.history) ? context.history : [];
      console.log(
        `[req] command  "${intent ?? ""}"  (model ${OLLAMA_MODEL}` +
          `${history.length ? `, ${history.length} prior turn(s)` : ""}` +
          `${context?.recentOutput ? ", +output" : ""})`,
      );

      const messages = [
        {
          role: "system",
          content:
            system || "You are a shell command assistant. Return strict JSON only.",
        },
      ];
      // Replay prior turns as dialogue so follow-ups ("export that") resolve.
      for (const turn of history) {
        if (turn?.intent) messages.push({ role: "user", content: String(turn.intent) });
        if (turn?.command)
          messages.push({ role: "assistant", content: String(turn.command) });
      }

      const userLines = [
        `OS: ${context?.os ?? "unknown"}`,
        `Shell: ${context?.shell ?? "unknown"}`,
        `Working directory: ${context?.cwd ?? "unknown"}`,
      ];
      if (context?.recentOutput) {
        userLines.push(
          `Recent terminal output (use it to resolve references like "this"/"that"):\n${String(
            context.recentOutput,
          ).slice(-4000)}`,
        );
      }
      userLines.push(`User intent: ${intent ?? ""}`);
      messages.push({ role: "user", content: userLines.join("\n") });

      const text = await ollamaChat({ messages });
      console.log(`[ok]  command  ${Date.now() - started}ms`);
      send(res, 200, { text });
      return;
    }

    if (req.method === "POST" && url === "/api/ai/explain") {
      const { output, context } = await readBody(req);
      console.log(`[req] explain  (model ${OLLAMA_MODEL})`);
      const user = [
        `OS: ${context?.os ?? "unknown"}`,
        `Shell: ${context?.shell ?? "unknown"}`,
        `Terminal output / error:\n${output ?? ""}`,
      ].join("\n");
      const text = await ollamaChat({
        messages: [
          { role: "system", content: EXPLAIN_SYSTEM },
          { role: "user", content: user },
        ],
      });
      // Return the parsed explanation object so the app reads it directly.
      try {
        send(res, 200, JSON.parse(text));
      } catch {
        send(res, 200, { title: "Error explanation", whatHappened: text, likelyCause: "", suggestedFix: "" });
      }
      return;
    }

    send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("[commandless-proxy]", err);
    send(res, 502, { error: err instanceof Error ? err.message : "Proxy error" });
  }
});

server.listen(PORT, () => {
  console.log(`[commandless-proxy] listening on :${PORT}`);
  console.log(`[commandless-proxy] model: ${OLLAMA_MODEL}  host: ${OLLAMA_HOST}`);
  console.log(
    `[commandless-proxy] guards: token=${APP_TOKEN ? "on" : "off"}  ` +
      `rate=${RATE_PER_MIN}/min/ip  dailyCap=${DAILY_CAP}`,
  );
});
