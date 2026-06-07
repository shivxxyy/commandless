import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Eraser,
  Settings as SettingsIcon,
  PanelRight,
  Terminal,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useUiStore } from "@/stores/uiStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { RECIPES } from "@/lib/recipes/recipes";
import { getTerminal } from "@/lib/terminal/registry";
import { cn } from "@/lib/utils/cn";
import { RiskBadge } from "./RiskBadge";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  keywords: string;
  run: () => void;
  risk?: "safe" | "medium" | "dangerous";
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPalette);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const requestIntent = useUiStore((s) => s.requestIntent);
  const playDemo = useUiStore((s) => s.playDemo);
  const createTab = useTerminalStore((s) => s.createTab);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const home = useSettingsStore((s) => s.home);
  const shell = useSettingsStore((s) => s.shell);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      {
        id: "new-terminal",
        label: "New terminal",
        group: "Actions",
        icon: <Plus className="h-4 w-4" />,
        keywords: "new terminal tab open",
        run: () => createTab({ cwd: home, shell }),
      },
      {
        id: "clear-terminal",
        label: "Clear terminal",
        group: "Actions",
        icon: <Eraser className="h-4 w-4" />,
        keywords: "clear terminal screen",
        run: () => activeTabId && getTerminal(activeTabId)?.clear(),
      },
      {
        id: "toggle-panel",
        label: "Toggle intelligence panel",
        group: "Actions",
        icon: <PanelRight className="h-4 w-4" />,
        keywords: "toggle right panel intelligence collapse",
        run: () => toggleRightPanel(),
      },
      {
        id: "open-settings",
        label: "Open settings",
        group: "Actions",
        icon: <SettingsIcon className="h-4 w-4" />,
        keywords: "settings preferences theme ai",
        run: () => setSettingsOpen(true),
      },
      {
        id: "play-demo",
        label: "Play demo reel",
        group: "Actions",
        icon: <Sparkles className="h-4 w-4" />,
        keywords: "demo reel record video showcase play",
        run: () => playDemo(),
      },
    ];

    const recipeItems: PaletteItem[] = RECIPES.map((r) => ({
      id: `recipe-${r.id}`,
      label: r.title,
      hint: r.preview,
      group: "Recipes",
      icon: <Terminal className="h-4 w-4" />,
      keywords: `${r.title} ${r.keywords.join(" ")} ${r.examples.join(" ")}`,
      risk: r.risk,
      run: () => requestIntent(r.examples[0] ?? r.title),
    }));

    return [...actions, ...recipeItems];
  }, [
    createTab,
    home,
    shell,
    activeTabId,
    toggleRightPanel,
    setSettingsOpen,
    requestIntent,
    playDemo,
  ]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((i) =>
      `${i.label} ${i.keywords}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const choose = (item: PaletteItem) => {
    item.run();
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[active];
      if (item) choose(item);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} align="top" showClose={false}>
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-3">
        <Search className="h-4 w-4 text-ink-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search recipes and actions…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus-ring"
        />
        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-ink-faint">
          esc
        </span>
      </div>
      <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-faint">
            Nothing matched “{query}”.
          </p>
        ) : (
          filtered.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(item)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                i === active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]",
              )}
            >
              <span className="text-ink-faint">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">
                  {item.label}
                </span>
                {item.hint && (
                  <span className="block truncate text-[11px] text-ink-faint">
                    {item.hint}
                  </span>
                )}
              </span>
              {item.group === "Recipes" && (
                <Sparkles className="h-3.5 w-3.5 text-ink-faint" />
              )}
              {item.risk && item.risk !== "safe" && (
                <RiskBadge level={item.risk} size="sm" />
              )}
              {i === active && (
                <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint" />
              )}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
