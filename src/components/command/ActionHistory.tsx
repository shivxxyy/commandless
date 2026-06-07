import { History } from "lucide-react";
import { useHistoryStore } from "@/stores/historyStore";
import { CommandCard } from "./CommandCard";

/** Compact, read-only list of recent action cards. */
export function ActionHistory() {
  const cards = useHistoryStore((s) => s.cards);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.07] py-8 text-center">
        <History className="h-5 w-5 text-ink-faint" />
        <p className="text-[13px] text-ink-soft">No actions yet</p>
        <p className="max-w-[14rem] text-[12px] text-ink-faint">
          Commands you suggest or run will appear here as cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cards.slice(0, 12).map((card) => (
        <CommandCard
          key={card.id}
          suggestion={card.suggestion}
          card={card}
          compact
        />
      ))}
    </div>
  );
}
