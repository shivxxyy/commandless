import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChevronRight,
  X,
  HelpCircle,
  MessageCircleQuestion,
} from "lucide-react";
import type { CommandSuggestion } from "@/lib/types";
import { useSuggest } from "@/hooks/useSuggest";
import { useCommandRunner } from "@/hooks/useCommandRunner";
import { useHistoryStore } from "@/stores/historyStore";
import { useUiStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { toast } from "@/stores/toastStore";
import { CommandCard } from "./CommandCard";
import { RecipeInputs } from "./RecipeInputs";
import { CommandCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

const QUICK_PROMPTS = [
  "Find large files here",
  "What is using port 3000?",
  "Show my Git changes",
  "Show disk usage",
];

export function IntentBar() {
  const { state, generate, finalizeRecipe, editCommand, reset, provider } =
    useSuggest();
  const { run } = useCommandRunner();
  const saveRecipe = useHistoryStore((s) => s.saveRecipe);
  const conversation = useHistoryStore((s) => s.conversation);
  const clearConversation = useHistoryStore((s) => s.clearConversation);
  const requestedIntent = useUiStore((s) => s.requestedIntent);
  const consumeIntent = useUiStore((s) => s.consumeIntent);
  const os = useSettingsStore((s) => s.os);
  const shell = useSettingsStore((s) => s.detectedShell);

  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (requestedIntent) {
      setValue(requestedIntent);
      void generate(requestedIntent);
      consumeIntent();
    }
  }, [requestedIntent, generate, consumeIntent]);

  const submit = (text?: string) => {
    const intent = (text ?? value).trim();
    if (!intent || state.status === "thinking") return;
    setValue(intent);
    void generate(intent);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleRun = (s: CommandSuggestion) => {
    void run(s);
    reset();
    setValue("");
  };

  const handleExplain = async (s: CommandSuggestion) => {
    if (!provider) {
      toast.info(s.explanation || "No explanation available.");
      return;
    }
    setExplaining(true);
    try {
      const r = await provider.explainError(
        `Explain this command in plain English: ${s.command}`,
        { os, shell, cwd: useTerminalStore.getState().activeTab()?.cwd },
      );
      toast.info(r.whatHappened || s.explanation);
    } catch {
      toast.error("Could not reach the AI provider.");
    } finally {
      setExplaining(false);
    }
  };

  const dismiss = () => {
    reset();
  };

  const showCard = state.status !== "idle";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-3xl">
        {/* Floating result card */}
        <AnimatePresence>
          {showCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              className="mb-2 max-h-[52vh] overflow-y-auto"
            >
              <div className="glass p-1.5">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-[12px] text-ink-faint">
                    {state.intent || "Suggestion"}
                  </span>
                  <button
                    onClick={dismiss}
                    className="rounded p-0.5 text-ink-faint hover:text-ink"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {state.status === "thinking" && (
                  <div className="p-1.5">
                    <CommandCardSkeleton />
                  </div>
                )}

                {state.status === "needs-inputs" && state.pendingRecipe && (
                  <RecipeInputs
                    recipe={state.pendingRecipe}
                    onSubmit={(inputs) =>
                      finalizeRecipe(state.pendingRecipe!, inputs, state.intent)
                    }
                    onCancel={dismiss}
                  />
                )}

                {state.status === "ready" && state.suggestion && (
                  <CommandCard
                    suggestion={state.suggestion}
                    onRun={handleRun}
                    onEdit={editCommand}
                    onExplain={handleExplain}
                    onSaveRecipe={saveRecipe}
                  />
                )}

                {state.status === "clarify" && (
                  <Notice
                    icon={<MessageCircleQuestion className="h-4 w-4 text-accent-400" />}
                    title="A bit more detail, please"
                    body={state.clarification}
                  />
                )}

                {(state.status === "empty" || state.status === "error") && (
                  <Notice
                    icon={<HelpCircle className="h-4 w-4 text-ink-faint" />}
                    title={state.status === "error" ? "Something went wrong" : "No match yet"}
                    body={state.errorMessage}
                  />
                )}
                {explaining && (
                  <p className="px-3 pb-2 text-xs text-ink-faint">
                    Asking the AI to explain…
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick prompt chips when idle + focused */}
        <AnimatePresence>
          {!showCard && focused && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 flex flex-wrap gap-1.5"
            >
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(p);
                  }}
                  className="rounded-md border border-white/[0.07] bg-graphite-850/80 px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:border-accent-500/40 hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory indicator */}
        {conversation.length > 0 && !showCard && (
          <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span>
              Remembering the last {conversation.length} step
              {conversation.length === 1 ? "" : "s"} for follow-ups
            </span>
            <button
              onClick={clearConversation}
              className="text-ink-faint underline-offset-2 hover:text-ink hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* The input bar */}
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border bg-graphite-850/90 px-3 py-2 backdrop-blur-md transition-colors",
            focused
              ? "border-accent-500/40 shadow-glow-blue"
              : "border-white/[0.08]",
          )}
        >
          <ChevronRight className="mb-1.5 h-4 w-4 shrink-0 text-accent-500" />
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            placeholder="Describe what you want to do, or type a command…"
            className="max-h-28 min-h-[24px] flex-1 resize-none border-0 bg-transparent py-1 pl-2 text-sm text-ink outline-none ring-0 placeholder:text-ink-faint focus:outline-none focus:ring-0"
          />
          <button
            onClick={() => submit()}
            disabled={!value.trim() || state.status === "thinking"}
            aria-label="Generate command"
            title="Generate command"
            className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500 text-white transition-all hover:bg-accent-400 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-1.5 p-3.5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium text-ink">{title}</p>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
