import type { RiskLevel } from "@/lib/types";

export interface RiskAssessment {
  level: RiskLevel;
  reason: string;
  /** Dangerous commands require the user to type a confirmation phrase. */
  requiresTypedConfirmation: boolean;
  /** The phrase the user must type for dangerous commands. */
  confirmationPhrase: string;
  /** Human-readable list of the specific signals that fired. */
  matched: string[];
}

export const DANGEROUS_CONFIRMATION_PHRASE = "RUN DANGEROUS COMMAND";

interface Rule {
  /** Test the normalized (lowercased, single-spaced) command. */
  test: RegExp;
  level: Exclude<RiskLevel, "safe">;
  label: string;
}

/**
 * Dangerous rules — anything destructive, privileged, or irreversible.
 * Order does not matter; the highest level among all matches wins.
 */
const DANGEROUS_RULES: Rule[] = [
  { test: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/, level: "dangerous", label: "recursive force delete (rm -rf)" },
  { test: /\brm\s+-[a-z]*r\b/, level: "dangerous", label: "recursive delete (rm -r)" },
  { test: /\bsudo\b/, level: "dangerous", label: "runs with administrator rights (sudo)" },
  { test: /\bdoas\b/, level: "dangerous", label: "runs with elevated rights (doas)" },
  { test: /\bdel\b|\berase\b/, level: "dangerous", label: "deletes files (del)" },
  { test: /\brmdir\b|\brd\s+\/s\b/, level: "dangerous", label: "removes directories" },
  { test: /remove-item\b.*-recurse/, level: "dangerous", label: "recursive remove (Remove-Item -Recurse)" },
  { test: /\bformat\b\s+[a-z]:|\bformat-volume\b/, level: "dangerous", label: "formats a disk" },
  { test: /\bmkfs(\.\w+)?\b/, level: "dangerous", label: "creates a filesystem (mkfs)" },
  { test: /\bdd\b\s+if=|\bdd\b\s+of=/, level: "dangerous", label: "raw disk write (dd)" },
  { test: /\bchmod\s+-[a-z]*r/, level: "dangerous", label: "recursive permission change (chmod -R)" },
  { test: /\bchown\s+-[a-z]*r/, level: "dangerous", label: "recursive ownership change (chown -R)" },
  { test: /\bchmod\b/, level: "dangerous", label: "changes file permissions (chmod)" },
  { test: /\bchown\b/, level: "dangerous", label: "changes file ownership (chown)" },
  { test: /\bkill(all)?\b|\bpkill\b|stop-process\b|taskkill\b/, level: "dangerous", label: "terminates a process" },
  { test: /\bcurl\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/, level: "dangerous", label: "pipes a remote script into the shell" },
  { test: /\bwget\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/, level: "dangerous", label: "pipes a remote script into the shell" },
  { test: /iwr\b.*\|\s*iex\b|invoke-expression\b/, level: "dangerous", label: "executes a downloaded script (Invoke-Expression)" },
  { test: />\s*\/dev\/sd[a-z]/, level: "dangerous", label: "writes directly to a disk device" },
  { test: /\/etc\/|\/system\/|c:\\windows\\system32/, level: "dangerous", label: "touches system directories" },
  { test: /\bdiskpart\b|\bfdisk\b/, level: "dangerous", label: "modifies disk partitions" },
];

/**
 * Medium rules — modifies files, installs packages, or changes project state.
 */
const MEDIUM_RULES: Rule[] = [
  { test: /\b(npm|pnpm|yarn|bun)\s+(install|i|add|ci|update|up)\b/, level: "medium", label: "installs or updates packages" },
  { test: /\bpip3?\s+install\b/, level: "medium", label: "installs Python packages" },
  { test: /\b(brew|apt|apt-get|dnf|yum|choco|winget|scoop)\s+(install|upgrade|update)\b/, level: "medium", label: "installs system packages" },
  { test: /\bgit\s+(push|commit|merge|reset|rebase|checkout|pull|clone)\b/, level: "medium", label: "changes git state" },
  { test: /\b(mkdir|touch|new-item)\b/, level: "medium", label: "creates files or folders" },
  { test: /\b(mv|move|rename|ren)\b/, level: "medium", label: "moves or renames files" },
  { test: /\b(cp|copy|copy-item)\b/, level: "medium", label: "copies files" },
  { test: /\b(zip|tar|gzip|compress-archive)\b/, level: "medium", label: "creates an archive" },
  { test: /\b(npm|pnpm|yarn|bun)\s+(run|start|dev|build)\b/, level: "medium", label: "runs a project script" },
  { test: />>?\s*[^&|]/, level: "medium", label: "writes output to a file" },
  { test: /\bln\s|-symbolic|new-item.*-itemtype\s+symboliclink/, level: "medium", label: "creates a link" },
];

const WS = /\s+/g;

function normalize(command: string): string {
  return command.trim().toLowerCase().replace(WS, " ");
}

/**
 * Classify a command into a risk level using deterministic pattern rules.
 * This runs locally and independently of the AI — it always re-checks any
 * command (including AI-suggested ones) before the UI permits running it.
 */
export function classifyRisk(command: string): RiskAssessment {
  const normalized = normalize(command);

  if (!normalized) {
    return {
      level: "safe",
      reason: "Empty command.",
      requiresTypedConfirmation: false,
      confirmationPhrase: "",
      matched: [],
    };
  }

  const dangerous = DANGEROUS_RULES.filter((r) => r.test.test(normalized));
  if (dangerous.length > 0) {
    return {
      level: "dangerous",
      reason: `This command ${joinLabels(dangerous.map((d) => d.label))}.`,
      requiresTypedConfirmation: true,
      confirmationPhrase: DANGEROUS_CONFIRMATION_PHRASE,
      matched: dangerous.map((d) => d.label),
    };
  }

  const medium = MEDIUM_RULES.filter((r) => r.test.test(normalized));
  if (medium.length > 0) {
    return {
      level: "medium",
      reason: `This command ${joinLabels(medium.map((m) => m.label))}.`,
      requiresTypedConfirmation: false,
      confirmationPhrase: "",
      matched: medium.map((m) => m.label),
    };
  }

  return {
    level: "safe",
    reason: "Read-only or low-impact. It does not change your files or system.",
    requiresTypedConfirmation: false,
    confirmationPhrase: "",
    matched: [],
  };
}

function joinLabels(labels: string[]): string {
  const unique = Array.from(new Set(labels));
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

/** Short human-readable copy for each risk level (sentence casing). */
export const RISK_COPY: Record<RiskLevel, { label: string; blurb: string }> = {
  safe: { label: "Safe", blurb: "Read-only or low-impact." },
  medium: {
    label: "Medium risk",
    blurb: "Changes files, installs packages, or modifies project state.",
  },
  dangerous: {
    label: "Dangerous",
    blurb: "Can delete, overwrite, kill processes, or change system settings.",
  },
};
