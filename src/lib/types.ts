/** Shared domain types for CommandLess. */

export type OsType = "macos" | "windows" | "linux" | "cross-platform";

export type RiskLevel = "safe" | "medium" | "dangerous";

export type CommandSource = "manual" | "recipe" | "ai";

export type CommandStatus =
  | "suggested"
  | "running"
  | "success"
  | "error"
  | "cancelled";

/** One alternative command the user can pick instead of the primary one. */
export interface CommandAlternative {
  label: string;
  command: string;
  reason: string;
}

/**
 * A command suggestion. This is the unit the intelligence panel produces,
 * whether it came from a built-in recipe or the AI provider. The local risk
 * engine always re-checks `command` before it is allowed to run.
 */
export interface CommandSuggestion {
  intent: string;
  command: string;
  explanation: string;
  riskLevel: RiskLevel;
  riskReason: string;
  requiresConfirmation: boolean;
  os: OsType;
  expectedOutcome: string;
  alternatives: CommandAlternative[];
  source: CommandSource;
  /** Set when the suggestion originated from a recipe. */
  recipeId?: string;
}

/** A card recorded in history for a suggested or executed command. */
export interface ActionCard {
  id: string;
  suggestion: CommandSuggestion;
  status: CommandStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  exitCode?: number;
  outputSummary?: string;
  rawOutput?: string;
}

/** Pattern-based (or AI-generated) explanation of a failed command. */
export interface ErrorInsight {
  id: string;
  title: string;
  whatHappened: string;
  likelyCause: string;
  suggestedFix: string;
  safeCommand?: string;
  matchedPattern?: string;
  fromAi: boolean;
  createdAt: number;
}
