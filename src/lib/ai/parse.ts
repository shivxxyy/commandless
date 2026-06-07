import type { OsType, RiskLevel } from "@/lib/types";
import type { AiCommandResponse } from "./types";

const RISK_LEVELS: RiskLevel[] = ["safe", "medium", "dangerous"];
const OS_TYPES: OsType[] = ["macos", "windows", "linux", "cross-platform"];

/**
 * Extract the first balanced JSON object from arbitrary model text.
 * Models sometimes wrap JSON in prose or ```json fences despite instructions,
 * so we scan for the first `{` and match braces (ignoring those inside strings).
 */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function coerceRisk(value: unknown): RiskLevel {
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (RISK_LEVELS.includes(v as RiskLevel)) return v as RiskLevel;
    if (v.includes("danger")) return "dangerous";
    if (v.includes("medium") || v.includes("warn")) return "medium";
  }
  // Unknown risk should fail safe toward caution.
  return "medium";
}

function coerceOs(value: unknown): OsType {
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (OS_TYPES.includes(v as OsType)) return v as OsType;
  }
  return "cross-platform";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Parse a provider's raw text into a validated AiCommandResponse.
 * Returns null only when no command could be recovered at all — callers then
 * fall back to recipes or surface a friendly error.
 */
export function parseAiCommandResponse(raw: string): AiCommandResponse | null {
  const jsonText = extractJsonObject(raw) ?? raw;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }

  const command = asString(parsed.command).trim();
  const needsClarification = parsed.needsClarification === true;

  if (!command && !needsClarification) {
    return null;
  }

  const alternativesRaw = Array.isArray(parsed.alternatives)
    ? parsed.alternatives
    : [];
  const alternatives = alternativesRaw
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      label: asString(a.label, "Alternative"),
      command: asString(a.command),
      reason: asString(a.reason),
    }))
    .filter((a) => a.command.trim().length > 0);

  return {
    intent: asString(parsed.intent),
    command,
    explanation: asString(
      parsed.explanation,
      "No explanation was provided for this command.",
    ),
    riskLevel: coerceRisk(parsed.riskLevel),
    riskReason: asString(parsed.riskReason),
    requiresConfirmation: parsed.requiresConfirmation !== false,
    os: coerceOs(parsed.os),
    expectedOutcome: asString(parsed.expectedOutcome),
    alternatives,
    needsClarification,
    clarificationQuestion: asString(parsed.clarificationQuestion),
  };
}
