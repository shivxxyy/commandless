import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Copy,
  Pencil,
  Sparkles,
  BookmarkPlus,
  ChevronDown,
  Check,
  ShieldAlert,
  Clock,
} from "lucide-react";
import type { ActionCard, CommandSuggestion } from "@/lib/types";
import {
  classifyRisk,
  DANGEROUS_CONFIRMATION_PHRASE,
  RISK_COPY,
} from "@/lib/risk/classifier";
import { RiskBadge } from "./RiskBadge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatTime } from "@/lib/utils/format";
import { toast } from "@/stores/toastStore";

interface CommandCardProps {
  suggestion: CommandSuggestion;
  card?: ActionCard;
  onRun?: (s: CommandSuggestion) => void;
  onEdit?: (command: string) => void;
  onExplain?: (s: CommandSuggestion) => void;
  onSaveRecipe?: (s: CommandSuggestion) => void;
  /** When true, render a denser read-only variant for the history list. */
  compact?: boolean;
}

const STATUS_LABEL: Record<NonNullable<ActionCard["status"]>, string> = {
  suggested: "Suggested",
  running: "Running",
  success: "Success",
  error: "Error",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  suggested: "text-ink-faint",
  running: "text-neon-cyan",
  success: "text-risk-safe",
  error: "text-risk-danger",
  cancelled: "text-ink-faint",
};

export function CommandCard({
  suggestion,
  card,
  onRun,
  onEdit,
  onExplain,
  onSaveRecipe,
  compact = false,
}: CommandCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggestion.command);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const isDangerous = suggestion.riskLevel === "dangerous";
  const status = card?.status;

  const copy = async () => {
    await navigator.clipboard.writeText(suggestion.command);
    setCopied(true);
    toast.success("Command copied.");
    setTimeout(() => setCopied(false), 1400);
  };

  const handleRunClick = () => {
    if (isDangerous) {
      setConfirming(true);
      return;
    }
    onRun?.(suggestion);
  };

  const confirmRun = () => {
    if (confirmText.trim() === DANGEROUS_CONFIRMATION_PHRASE) {
      setConfirming(false);
      setConfirmText("");
      onRun?.(suggestion);
    }
  };

  const saveEdit = () => {
    setEditing(false);
    if (draft.trim() && draft !== suggestion.command) onEdit?.(draft.trim());
  };

  // Re-classify the draft live while editing so the user sees risk shift.
  const draftRisk = editing ? classifyRisk(draft).level : suggestion.riskLevel;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-soft overflow-hidden",
        isDangerous && "border-risk-danger/25",
        !compact && "hover:border-white/10",
      )}
    >
      <div className="space-y-3 p-4">
        {/* Header: intent + risk + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {suggestion.intent || "Command"}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
              <span>{osLabel(suggestion.os)}</span>
              {suggestion.source === "ai" && (
                <span className="inline-flex items-center gap-1 text-neon-violet">
                  <Sparkles className="h-3 w-3" /> AI
                </span>
              )}
              {suggestion.source === "recipe" && <span>Recipe</span>}
              {card && (
                <span className={cn(STATUS_STYLE[status ?? "suggested"])}>
                  {STATUS_LABEL[status ?? "suggested"]}
                </span>
              )}
              {card?.durationMs != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(card.durationMs)}
                </span>
              )}
              {card && <span>{formatTime(card.createdAt)}</span>}
            </div>
          </div>
          <RiskBadge level={draftRisk} size="sm" />
        </div>

        {/* Command */}
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            autoFocus
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-graphite-900/80 px-3 py-2 font-mono text-[13px] text-ink focus-ring"
          />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-graphite-900/70 px-3 py-2">
            <span className="select-none text-ink-faint">$</span>
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[13px] text-ink">
              {suggestion.command || "—"}
            </code>
          </div>
        )}

        {/* Explanation */}
        {!compact && suggestion.explanation && (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {suggestion.explanation}
          </p>
        )}

        {/* Risk reason */}
        {!compact && suggestion.riskLevel !== "safe" && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg p-2.5 text-xs",
              isDangerous
                ? "bg-risk-danger/[0.08] text-risk-danger/90"
                : "bg-risk-medium/[0.08] text-risk-medium/90",
            )}
          >
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {RISK_COPY[suggestion.riskLevel].blurb} {suggestion.riskReason}
            </span>
          </div>
        )}

        {/* Output details (executed cards) */}
        {card?.rawOutput && (
          <div>
            <button
              onClick={() => setShowOutput((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  showOutput && "rotate-180",
                )}
              />
              Output details
            </button>
            <AnimatePresence>
              {showOutput && (
                <motion.pre
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 max-h-48 overflow-auto rounded-lg bg-graphite-950/80 p-3 font-mono text-[12px] text-ink-soft"
                >
                  {card.rawOutput}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Dangerous confirmation */}
        <AnimatePresence>
          {confirming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 rounded-lg border border-risk-danger/30 bg-risk-danger/[0.07] p-3"
            >
              <p className="text-xs text-risk-danger/90">
                This is a dangerous command. To run it, type{" "}
                <span className="font-mono font-semibold">
                  {DANGEROUS_CONFIRMATION_PHRASE}
                </span>{" "}
                below.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmRun()}
                placeholder={DANGEROUS_CONFIRMATION_PHRASE}
                className="w-full rounded-lg border border-risk-danger/30 bg-graphite-900/80 px-3 py-2 font-mono text-[13px] text-ink focus-ring"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirmText.trim() !== DANGEROUS_CONFIRMATION_PHRASE}
                  onClick={confirmRun}
                >
                  Run dangerous command
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alternatives */}
        {!compact && suggestion.alternatives.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-ink-faint">Safer alternatives</p>
            {suggestion.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => onEdit?.(alt.command)}
                className="block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="text-xs font-medium text-ink">{alt.label}</span>
                <code className="mt-0.5 block truncate font-mono text-[12px] text-ink-soft">
                  {alt.command}
                </code>
                {alt.reason && (
                  <span className="text-[11px] text-ink-faint">{alt.reason}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {!compact && (onRun || onEdit || onExplain || onSaveRecipe) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {onRun && status !== "running" && (
              <Button variant="primary" size="sm" onClick={handleRunClick}>
                <Play className="h-3.5 w-3.5" />
                Run command
              </Button>
            )}
            <IconButton label={copied ? "Copied" : "Copy"} onClick={copy}>
              {copied ? (
                <Check className="h-4 w-4 text-risk-safe" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </IconButton>
            {onEdit && (
              <IconButton
                label="Edit"
                active={editing}
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil className="h-4 w-4" />
              </IconButton>
            )}
            {onExplain && (
              <IconButton label="Explain" onClick={() => onExplain(suggestion)}>
                <Sparkles className="h-4 w-4" />
              </IconButton>
            )}
            {onSaveRecipe && (
              <IconButton
                label="Save as recipe"
                onClick={() => {
                  onSaveRecipe(suggestion);
                  toast.success("Saved to your recipes.");
                }}
              >
                <BookmarkPlus className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function osLabel(os: CommandSuggestion["os"]): string {
  switch (os) {
    case "macos":
      return "macOS";
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return "Cross-platform";
  }
}
