import { OLLAMA_MODEL, hasKey } from "../server/core.mjs";

export default function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({ ok: true, model: OLLAMA_MODEL, hasKey: hasKey() });
}
