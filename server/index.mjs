// CommandLess AI proxy — local dev server (long-lived HTTP).
// -------------------------------------------------------------------------
// For LOCAL development (`npm run proxy`). Production runs the same logic as
// Vercel serverless functions in api/ai/*.js — both import server/core.mjs,
// so there's a single source of truth.
//
//   POST /api/ai/command   { system, intent, context } -> { text }
//   POST /api/ai/explain   { output, context }         -> { title, ... }
//   GET  /health                                       -> { ok, model, hasKey }

import "./loadenv.mjs"; // must come first so core.mjs sees the env
import http from "node:http";
import {
  OLLAMA_MODEL,
  hasKey,
  tokenOk,
  clientIp,
  checkLimits,
  commandText,
  explainObject,
} from "./core.mjs";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, x-commandless-token",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
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
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = (req.url || "").split("?")[0];

  if (req.method === "GET" && url === "/health") {
    return send(res, 200, { ok: true, model: OLLAMA_MODEL, hasKey: hasKey() });
  }

  if (url.startsWith("/api/ai/")) {
    if (!tokenOk(req.headers["x-commandless-token"])) return send(res, 401, { error: "Unauthorized" });
    const limited = checkLimits(clientIp(req));
    if (limited) return send(res, 429, { error: limited });
  }

  try {
    if (req.method === "POST" && url === "/api/ai/command") {
      const body = await readBody(req);
      const started = Date.now();
      console.log(`[req] command  "${body.intent ?? ""}"  (model ${OLLAMA_MODEL})`);
      const text = await commandText(body);
      console.log(`[ok]  command  ${Date.now() - started}ms`);
      return send(res, 200, { text });
    }
    if (req.method === "POST" && url === "/api/ai/explain") {
      const body = await readBody(req);
      console.log(`[req] explain  (model ${OLLAMA_MODEL})`);
      return send(res, 200, await explainObject(body));
    }
    return send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("[commandless-proxy]", err);
    return send(res, 502, { error: err instanceof Error ? err.message : "Proxy error" });
  }
});

server.listen(PORT, () => {
  console.log(`[commandless-proxy] listening on :${PORT}`);
  console.log(`[commandless-proxy] model: ${OLLAMA_MODEL}  hasKey: ${hasKey()}`);
});
