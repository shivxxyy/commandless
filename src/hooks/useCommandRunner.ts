import { useCallback } from "react";
import type { CommandSuggestion } from "@/lib/types";
import { useTerminalStore } from "@/stores/terminalStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "@/stores/toastStore";
import { ptyWrite, isTauri } from "@/lib/terminal/ptyClient";
import { detectError } from "@/lib/errors/explainer";

/**
 * Central place to run a suggested command in the active terminal and record
 * an action card. The terminal's own output stream updates the card's status
 * and feeds the error explainer.
 */
export function useCommandRunner() {
  const addCard = useHistoryStore((s) => s.addCard);
  const updateCard = useHistoryStore((s) => s.updateCard);
  const addInsight = useHistoryStore((s) => s.addInsight);
  const os = useSettingsStore((s) => s.os);

  const run = useCallback(
    async (suggestion: CommandSuggestion): Promise<string | null> => {
      const activeTab = useTerminalStore.getState().activeTab();
      const cardId = addCard(suggestion, "running");

      if (!activeTab) {
        toast.error("Open a terminal tab first.");
        updateCard(cardId, { status: "cancelled" });
        return cardId;
      }

      if (!isTauri()) {
        toast.info("Running commands needs the desktop app (PTY backend).");
        updateCard(cardId, {
          status: "cancelled",
          outputSummary: "Preview mode — no real shell attached.",
        });
        return cardId;
      }

      const startedAt = Date.now();
      updateCard(cardId, { startedAt });
      useTerminalStore.getState().setRunning(activeTab.id, true);

      try {
        // Writing the command + carriage return runs it in the live PTY.
        await ptyWrite(activeTab.sessionId, suggestion.command + "\r");
        toast.success("Command sent to terminal.");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        updateCard(cardId, {
          status: "error",
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
          outputSummary: message,
        });
        const pattern = detectError(message);
        if (pattern) {
          addInsight({
            title: pattern.title,
            whatHappened: pattern.whatHappened,
            likelyCause: pattern.likelyCause,
            suggestedFix: pattern.suggestedFix,
            safeCommand: pattern.safeCommand?.(os),
            matchedPattern: pattern.id,
            fromAi: false,
          });
        }
        toast.error("Command failed to send.");
      }
      return cardId;
    },
    [addCard, updateCard, addInsight, os],
  );

  return { run };
}
