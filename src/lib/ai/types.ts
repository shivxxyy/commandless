import type { CommandAlternative, OsType, RiskLevel } from "@/lib/types";

/** Provider identifiers configurable in Settings. */
export type AiProviderKind = "none" | "proxy" | "local-ollama";

/** One earlier turn of the conversation (for follow-up requests). */
export interface ConversationTurn {
  intent: string;
  command: string;
}

/** Context the app passes to a provider so it can target the right shell/OS. */
export interface AiRequestContext {
  os: OsType;
  shell: string;
  cwd?: string;
  /** Recent terminal output. Only sent when the user opts in. */
  recentOutput?: string;
  /** Recent (intent → command) turns so follow-ups like "export that" work. */
  history?: ConversationTurn[];
}

/** The raw, structured JSON contract every provider must return. */
export interface AiCommandResponse {
  intent: string;
  command: string;
  explanation: string;
  riskLevel: RiskLevel;
  riskReason: string;
  requiresConfirmation: boolean;
  os: OsType;
  expectedOutcome: string;
  alternatives: CommandAlternative[];
  /** Present when the model declined and wants the user to clarify. */
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

/** Provider configuration sourced from Settings. */
export interface AiProviderConfig {
  kind: AiProviderKind;
  proxyUrl: string;
  ollamaUrl: string;
  model: string;
}

export interface AiProvider {
  readonly kind: AiProviderKind;
  /** Convert a natural-language intent into a structured command response. */
  suggestCommand(
    intent: string,
    ctx: AiRequestContext,
  ): Promise<AiCommandResponse>;
  /** Explain an error from terminal output. */
  explainError(
    output: string,
    ctx: AiRequestContext,
  ): Promise<{ title: string; whatHappened: string; likelyCause: string; suggestedFix: string; safeCommand?: string }>;
}

/** Shared strict system prompt for all providers. */
export const SYSTEM_PROMPT = `You are a shell command assistant inside CommandLess. Convert the user's intent into one safe shell command for the detected OS and shell. Return strict JSON only. Do not include markdown. Prefer read-only commands unless the user explicitly asks to modify something. Never suggest destructive commands without safer alternatives. Never suggest commands that delete broad system paths, format disks, change ownership recursively at root, pipe remote scripts into shell, or disable security features. If the request is ambiguous, return a response asking for clarification instead of inventing a dangerous command.

Respond with JSON matching exactly this shape:
{
  "intent": "string",
  "command": "string",
  "explanation": "string",
  "riskLevel": "safe|medium|dangerous",
  "riskReason": "string",
  "requiresConfirmation": true,
  "os": "macos|windows|linux|cross-platform",
  "expectedOutcome": "string",
  "alternatives": [{ "label": "string", "command": "string", "reason": "string" }],
  "needsClarification": false,
  "clarificationQuestion": ""
}`;
