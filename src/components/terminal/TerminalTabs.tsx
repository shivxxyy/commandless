import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

export function TerminalTabs() {
  const tabs = useTerminalStore((s) => s.tabs);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const closeTab = useTerminalStore((s) => s.closeTab);
  const renameTab = useTerminalStore((s) => s.renameTab);
  const createTab = useTerminalStore((s) => s.createTab);
  const home = useSettingsStore((s) => s.home);
  const shell = useSettingsStore((s) => s.shell);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleClose = (id: string, running: boolean) => {
    if (running) {
      const ok = window.confirm(
        "This terminal is still running a command. Close it anyway?",
      );
      if (!ok) return;
    }
    closeTab(id);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <motion.div
            key={tab.id}
            layout
            onClick={() => setActiveTab(tab.id)}
            onDoubleClick={() => {
              setEditingId(tab.id);
              setDraft(tab.title);
            }}
            className={cn(
              "group flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] transition-colors",
              isActive
                ? "border-white/10 bg-white/[0.07] text-ink"
                : "border-transparent text-ink-soft hover:bg-white/[0.04] hover:text-ink",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                tab.running
                  ? "animate-pulse-glow bg-neon-cyan"
                  : tab.exited
                    ? "bg-ink-faint"
                    : "bg-risk-safe/70",
              )}
            />
            {editingId === tab.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  renameTab(tab.id, draft.trim() || tab.title);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameTab(tab.id, draft.trim() || tab.title);
                    setEditingId(null);
                  }
                }}
                className="w-24 bg-transparent text-ink focus-ring"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="max-w-[12rem] truncate">{tab.title}</span>
            )}
            <button
              aria-label="Close tab"
              title="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(tab.id, tab.running);
              }}
              className="rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        );
      })}
      <IconButton
        label="New terminal"
        onClick={() => createTab({ cwd: home, shell })}
        className="shrink-0"
      >
        <Plus className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
