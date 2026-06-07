import { useCallback, useMemo, useState } from "react";
import type { CommandSuggestion } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useHistoryStore } from "@/stores/historyStore";
import { getOutput } from "@/lib/terminal/output";
import { createAiProvider } from "@/lib/ai";
import { bestRecipe } from "@/lib/recipes/match";
import type { Recipe } from "@/lib/recipes/types";
import { aiToSuggestion, recipeToSuggestion } from "@/lib/suggest";
import { classifyRisk } from "@/lib/risk/classifier";

export type SuggestStatus =
  | "idle"
  | "thinking"
  | "ready"
  | "needs-inputs"
  | "clarify"
  | "empty"
  | "error";

interface SuggestState {
  status: SuggestStatus;
  suggestion: CommandSuggestion | null;
  pendingRecipe: Recipe | null;
  intent: string;
  clarification: string;
  errorMessage: string;
}

const INITIAL: SuggestState = {
  status: "idle",
  suggestion: null,
  pendingRecipe: null,
  intent: "",
  clarification: "",
  errorMessage: "",
};

export function useSuggest() {
  const [state, setState] = useState<SuggestState>(INITIAL);

  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const proxyUrl = useSettingsStore((s) => s.proxyUrl);
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const model = useSettingsStore((s) => s.model);
  const allowAiCustomCommands = useSettingsStore((s) => s.allowAiCustomCommands);
  const requireConfirmationForAllAi = useSettingsStore(
    (s) => s.requireConfirmationForAllAi,
  );
  const os = useSettingsStore((s) => s.os);
  const shell = useSettingsStore((s) => s.detectedShell);

  const provider = useMemo(
    () => createAiProvider({ kind: aiProvider, proxyUrl, ollamaUrl, model }),
    [aiProvider, proxyUrl, ollamaUrl, model],
  );

  const cwd = () => useTerminalStore.getState().activeTab()?.cwd;

  /** Gather session memory (and, if opted in, recent output) for a request. */
  const buildContext = () => {
    const turns = useHistoryStore.getState().conversation;
    // Stored most-recent-first; send oldest-first as a natural dialogue.
    const history = turns
      .slice(0, 4)
      .reverse()
      .map((t) => ({ intent: t.intent, command: t.command }));
    let recentOutput: string | undefined;
    if (useSettingsStore.getState().shareTerminalOutput) {
      const tabId = useTerminalStore.getState().activeTabId;
      if (tabId) recentOutput = getOutput(tabId) || undefined;
    }
    return { os, shell, cwd: cwd(), history, recentOutput };
  };

  const finalizeRecipe = useCallback(
    (recipe: Recipe, inputs: Record<string, string>, intent: string) => {
      const suggestion = recipeToSuggestion(recipe, { os, cwd: cwd(), inputs });
      useHistoryStore.getState().addTurn(intent, suggestion.command);
      setState({
        ...INITIAL,
        status: "ready",
        suggestion,
        intent,
      });
    },
    [os],
  );

  const generate = useCallback(
    async (intent: string) => {
      const trimmed = intent.trim();
      if (!trimmed) return;

      // 1) Try a built-in recipe first (deterministic, no AI).
      const recipe = bestRecipe(trimmed);
      if (recipe) {
        const missing = recipe.inputs.filter((i) => i.required);
        if (missing.length > 0) {
          // Pre-fill any defaults, otherwise ask the user.
          const defaults: Record<string, string> = {};
          let needsInput = false;
          for (const input of recipe.inputs) {
            if (input.defaultValue) defaults[input.id] = input.defaultValue;
            else if (input.required) needsInput = true;
          }
          if (needsInput) {
            setState({
              ...INITIAL,
              status: "needs-inputs",
              pendingRecipe: recipe,
              intent: trimmed,
            });
            return;
          }
          finalizeRecipe(recipe, defaults, trimmed);
          return;
        }
        finalizeRecipe(recipe, {}, trimmed);
        return;
      }

      // 2) No recipe — fall back to AI if it's enabled and allowed.
      if (!provider || !allowAiCustomCommands) {
        setState({
          ...INITIAL,
          status: "empty",
          intent: trimmed,
          errorMessage:
            provider && !allowAiCustomCommands
              ? "Custom AI commands are turned off in Settings."
              : "No built-in recipe matched, and AI is turned off. Try rephrasing, or enable an AI provider in Settings.",
        });
        return;
      }

      setState({ ...INITIAL, status: "thinking", intent: trimmed });
      try {
        const ai = await provider.suggestCommand(trimmed, buildContext());
        if (ai.needsClarification) {
          setState({
            ...INITIAL,
            status: "clarify",
            intent: trimmed,
            clarification:
              ai.clarificationQuestion || "Could you add more detail?",
          });
          return;
        }
        const suggestion = aiToSuggestion(ai, os);
        if (requireConfirmationForAllAi) suggestion.requiresConfirmation = true;
        useHistoryStore.getState().addTurn(trimmed, suggestion.command);
        setState({ ...INITIAL, status: "ready", suggestion, intent: trimmed });
      } catch (err) {
        setState({
          ...INITIAL,
          status: "error",
          intent: trimmed,
          errorMessage:
            err instanceof Error ? err.message : "The AI request failed.",
        });
      }
    },
    [
      provider,
      allowAiCustomCommands,
      requireConfirmationForAllAi,
      os,
      shell,
      finalizeRecipe,
    ],
  );

  const editCommand = useCallback((command: string) => {
    setState((s) => {
      if (!s.suggestion) return s;
      // Re-check risk locally whenever the command text changes.
      const assessment = classifyRisk(command);
      return {
        ...s,
        suggestion: {
          ...s.suggestion,
          command,
          source: "manual",
          riskLevel: assessment.level,
          riskReason: assessment.reason,
          requiresConfirmation: assessment.level !== "safe",
        },
      };
    });
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, generate, finalizeRecipe, editCommand, reset, provider };
}
