import { tokenOk, clientIp, checkLimits, explainObject } from "../../server/core.mjs";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-commandless-token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!tokenOk(req.headers["x-commandless-token"]))
    return res.status(401).json({ error: "Unauthorized" });
  const limited = checkLimits(clientIp(req));
  if (limited) return res.status(429).json({ error: limited });

  try {
    const data = await explainObject(req.body || {});
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e?.message || "Proxy error" });
  }
}
