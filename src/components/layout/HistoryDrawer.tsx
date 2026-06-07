import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Cloud, Server, CircleSlash, Bookmark, Trash2 } from "lucide-react";
import type { ErrorInsight } from "@/lib/types";
import { useUiStore } from "@/stores/uiStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { createAiProvider } from "@/lib/ai";
import { toast } from "@/stores/toastStore";
import { IconButton } from "@/components/ui/IconButton";
import { ErrorInsightCard } from "@/components/command/ErrorInsightCard";
import { ActionHistory } from "@/components/command/ActionHistory";
import { cn } from "@/lib/utils/cn";

const PROVIDER_META = {
  proxy: { label: "Cloud proxy", icon: Cloud },
  "local-ollama": { label: "Local Ollama", icon: Server },
  none: { label: "Recipes only", icon: CircleSlash },
} as const;

export function HistoryDrawer() {
  const open = !useUiStore((s) => s.rightPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleRightPanel);
  const insights = useHistoryStore((s) => s.insights);
  const dismissInsight = useHistoryStore((s) => s.dismissInsight);
  const addInsight = useHistoryStore((s) => s.addInsight);
  const savedRecipes = useHistoryStore((s) => s.savedRecipes);
  const removeSavedRecipe = useHistoryStore((s) => s.removeSavedRecipe);

  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const proxyUrl = useSettingsStore((s) => s.proxyUrl);
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const model = useSettingsStore((s) => s.model);
  const os = useSettingsStore((s) => s.os);
  const shell = useSettingsStore((s) => s.detectedShell);

  const [askingId, setAskingId] = useState<string | null>(null);

  const provider = createAiProvider({ kind: aiProvider, proxyUrl, ollamaUrl, model });
  const meta = PROVIDER_META[aiProvider];
  const ProviderIcon = meta.icon;

  const handleAskAi = async (insight: ErrorInsight) => {
    if (!provider) return;
    setAskingId(insight.id);
    try {
      const r = await provider.explainError(
        `${insight.title}. ${insight.whatHappened}`,
        { os, shell },
      );
      addInsight({
        title: r.title || insight.title,
        whatHappened: r.whatHappened,
        likelyCause: r.likelyCause,
        suggestedFix: r.suggestedFix,
        safeCommand: r.safeCommand,
        fromAi: true,
      });
      dismissInsight(insight.id);
    } catch {
      toast.error("Could not reach the AI provider.");
    } finally {
      setAskingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
          />
          <motion.aside
            className="absolute right-0 top-0 z-40 flex h-full w-[360px] flex-col border-l border-white/[0.07] bg-graphite-900/95 backdrop-blur-md"
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Activity</h2>
              <IconButton label="Close" onClick={toggle}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              {/* AI provider status */}
              <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.05] text-accent-400">
                  <ProviderIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] text-ink-faint">AI provider</span>
                  <span className="block truncate text-[13px] text-ink">{meta.label}</span>
                </span>
                <span
                  className={cn(
                    "ml-auto h-2 w-2 rounded-full",
                    aiProvider === "none" ? "bg-ink-faint" : "bg-risk-safe",
                  )}
                />
              </div>

              {/* Error insights */}
              {insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-ink-faint">Error insights</p>
                  <AnimatePresence>
                    {insights.map((insight) => (
                      <ErrorInsightCard
                        key={insight.id}
                        insight={insight}
                        onDismiss={() => dismissInsight(insight.id)}
                        onAskAi={() => handleAskAi(insight)}
                        aiAvailable={!!provider}
                        aiBusy={askingId === insight.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Recent actions */}
              <div className="space-y-2">
                <p className="text-[11px] text-ink-faint">Recent actions</p>
                <ActionHistory />
              </div>

              {/* Saved recipes */}
              {savedRecipes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-ink-faint">Saved recipes</p>
                  {savedRecipes.map((r) => (
                    <div
                      key={r.id}
                      className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
                    >
                      <Bookmark className="h-4 w-4 shrink-0 text-ink-faint" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{r.title}</span>
                        <code className="block truncate font-mono text-[11px] text-ink-faint">
                          {r.command}
                        </code>
                      </span>
                      <button
                        onClick={() => removeSavedRecipe(r.id)}
                        className="rounded p-1 text-ink-faint opacity-0 hover:text-risk-danger group-hover:opacity-100"
                        aria-label="Remove saved recipe"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
