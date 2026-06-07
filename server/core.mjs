// Shared proxy core — used by both the local dev server (server/index.mjs)
// and the Vercel serverless functions (api/ai/*.js). One source of truth for
// the Ollama Cloud call, the token gate, and the (best-effort) rate limiting.

const OLLAMA_HOST = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/$/, "");
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
const APP_TOKEN = process.env.APP_TOKEN || "";
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN || 15);
const DAILY_CAP = Number(process.env.DAILY_CAP || 1500);

export const hasKey = () => !!OLLAMA_API_KEY;

export const EXPLAIN_SYSTEM = `You explain shell command errors clearly for CommandLess. Return strict JSON only, no markdown, matching:
{ "title": "string", "whatHappened": "string", "likelyCause": "string", "suggestedFix": "string", "safeCommand": "string" }
Keep it concise and plain-English. safeCommand may be an empty string if not applicable.`;

// --- best-effort rate limiting (per warm instance) ------------------------
// On serverless this only protects within a single warm instance; the token
// gate is the reliable guard. For hard guarantees, back this with a KV store.
const ipHits = new Map();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

export function tokenOk(headerValue) {
  if (!APP_TOKEN) return true;
  return headerValue === APP_TOKEN;
}

export function clientIp(req) {
  const xff = req.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/** Returns null if allowed, else a message string. */
export function checkLimits(ip) {
  const now = Date.now();
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
  }
  if (dailyCount >= DAILY_CAP) return "Daily usage cap reached. Try again tomorrow.";
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

async function ollamaChat(messages) {
  if (!OLLAMA_API_KEY) throw new Error("Server is missing OLLAMA_API_KEY.");
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
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
  dailyCount += 1;
  return data?.message?.content ?? "";
}

/** Build a command suggestion. Returns the raw model JSON string ({ text }). */
export async function commandText({ system, intent, context }) {
  const history = Array.isArray(context?.history) ? context.history : [];
  const messages = [
    {
      role: "system",
      content: system || "You are a shell command assistant. Return strict JSON only.",
    },
  ];
  for (const turn of history) {
    if (turn?.intent) messages.push({ role: "user", content: String(turn.intent) });
    if (turn?.command) messages.push({ role: "assistant", content: String(turn.command) });
  }
  const lines = [
    `OS: ${context?.os ?? "unknown"}`,
    `Shell: ${context?.shell ?? "unknown"}`,
    `Working directory: ${context?.cwd ?? "unknown"}`,
  ];
  if (context?.recentOutput) {
    lines.push(
      `Recent terminal output (use it to resolve references like "this"/"that"):\n${String(
        context.recentOutput,
      ).slice(-4000)}`,
    );
  }
  lines.push(`User intent: ${intent ?? ""}`);
  messages.push({ role: "user", content: lines.join("\n") });
  return ollamaChat(messages);
}

/** Explain an error. Returns a parsed object. */
export async function explainObject({ output, context }) {
  const user = [
    `OS: ${context?.os ?? "unknown"}`,
    `Shell: ${context?.shell ?? "unknown"}`,
    `Terminal output / error:\n${output ?? ""}`,
  ].join("\n");
  const text = await ollamaChat([
    { role: "system", content: EXPLAIN_SYSTEM },
    { role: "user", content: user },
  ]);
  try {
    return JSON.parse(text);
  } catch {
    return { title: "Error explanation", whatHappened: text, likelyCause: "", suggestedFix: "" };
  }
}
