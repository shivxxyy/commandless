import { useState, type KeyboardEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const EXAMPLE_PROMPTS = [
  "Find large files here",
  "What is using port 3000?",
  "Show hidden files",
  "Compress this folder",
  "Search TODO in this project",
  "Show my Git changes",
  "Run this project",
  "Check internet connection",
  "Show disk usage",
];

interface CommandInputProps {
  onSubmit: (intent: string) => void;
  loading?: boolean;
}

export function CommandInput({ onSubmit, loading }: CommandInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "group relative rounded-xl border border-white/10 bg-graphite-900/60 transition-colors focus-within:border-neon-blue/40 focus-within:shadow-glow-blue",
        )}
      >
        <Sparkles className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neon-violet" />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Describe what you want to do…"
          className="w-full resize-none bg-transparent py-3 pl-10 pr-12 text-sm text-ink placeholder:text-ink-faint focus-ring"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || loading}
          aria-label="Generate command"
          title="Generate command"
          className="absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neon-gradient text-white shadow-glow-blue transition-all hover:brightness-110 disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setValue(p);
              onSubmit(p);
            }}
            className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:border-neon-blue/30 hover:bg-white/[0.06] hover:text-ink"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
