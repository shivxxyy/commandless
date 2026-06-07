import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, X, Copy, Check } from "lucide-react";
import type { ErrorInsight } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { toast } from "@/stores/toastStore";

interface ErrorInsightCardProps {
  insight: ErrorInsight;
  onDismiss: () => void;
  onAskAi?: () => void;
  aiAvailable?: boolean;
  aiBusy?: boolean;
}

export function ErrorInsightCard({
  insight,
  onDismiss,
  onAskAi,
  aiAvailable,
  aiBusy,
}: ErrorInsightCardProps) {
  const [copied, setCopied] = useState(false);

  const copySafe = async () => {
    if (!insight.safeCommand) return;
    await navigator.clipboard.writeText(insight.safeCommand);
    setCopied(true);
    toast.success("Copied suggested command.");
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="glass-soft border-risk-danger/20 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-risk-danger" />
          <p className="text-sm font-medium text-ink">{insight.title}</p>
          {insight.fromAi && (
            <span className="inline-flex items-center gap-1 text-[11px] text-neon-violet">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        <IconButton label="Dismiss" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="mt-3 space-y-2.5 text-[13px]">
        <Row label="What happened" value={insight.whatHappened} />
        {insight.likelyCause && (
          <Row label="Likely cause" value={insight.likelyCause} />
        )}
        {insight.suggestedFix && (
          <Row label="Suggested fix" value={insight.suggestedFix} />
        )}
      </div>

      {insight.safeCommand && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-graphite-900/70 px-3 py-2">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[12px] text-ink-soft">
            {insight.safeCommand}
          </code>
          <IconButton label={copied ? "Copied" : "Copy"} onClick={copySafe}>
            {copied ? (
              <Check className="h-4 w-4 text-risk-safe" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      )}

      {!insight.fromAi && aiAvailable && onAskAi && (
        <Button
          variant="subtle"
          size="sm"
          className="mt-3"
          disabled={aiBusy}
          onClick={onAskAi}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {aiBusy ? "Asking AI…" : "Ask AI to explain this error"}
        </Button>
      )}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="leading-relaxed text-ink-soft">{value}</p>
    </div>
  );
}
