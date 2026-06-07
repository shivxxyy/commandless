import {
  FolderOpen,
  Eraser,
  Command as CommandIcon,
  PanelRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TerminalTabs } from "@/components/terminal/TerminalTabs";
import { IconButton } from "@/components/ui/IconButton";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUiStore } from "@/stores/uiStore";
import { useHistoryStore } from "@/stores/historyStore";
import { getTerminal } from "@/lib/terminal/registry";
import { isTauri } from "@/lib/terminal/ptyClient";
import { truncateMiddle } from "@/lib/utils/format";
import { toast } from "@/stores/toastStore";

export function TopBar() {
  const activeTab = useTerminalStore((s) => s.activeTab());
  const createTab = useTerminalStore((s) => s.createTab);
  const setCwd = useTerminalStore((s) => s.setCwd);
  const detectedShell = useSettingsStore((s) => s.detectedShell);
  const shellPref = useSettingsStore((s) => s.shell);
  const home = useSettingsStore((s) => s.home);
  const setCommandPalette = useUiStore((s) => s.setCommandPalette);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const insights = useHistoryStore((s) => s.insights);
  const addRecentFolder = useHistoryStore((s) => s.addRecentFolder);

  const shellName = shellPref || detectedShell || "shell";

  const clearActive = () => {
    if (activeTab) getTerminal(activeTab.id)?.clear();
  };

  const pickFolder = async () => {
    if (!isTauri()) {
      toast.info("Folder picking needs the desktop app.");
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        addRecentFolder(selected);
        createTab({ cwd: selected, shell: shellPref, title: folderName(selected) });
        if (activeTab) setCwd(activeTab.id, selected);
        toast.success("Opened a terminal in the selected folder.");
      }
    } catch {
      toast.error("Could not open the folder picker.");
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] px-3">
      <Logo size="sm" />
      <div className="h-5 w-px bg-white/[0.08]" />

      {/* Tabs take the center, scrollable */}
      <div className="min-w-0 flex-1">
        <TerminalTabs />
      </div>

      {/* Context: shell · cwd */}
      <div className="hidden items-center gap-1.5 text-[12px] text-ink-faint md:flex">
        <span className="text-ink-soft">{shellName}</span>
        {activeTab?.cwd && (
          <>
            <span>·</span>
            <span>{truncateMiddle(displayCwd(activeTab.cwd, home), 28)}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton label="Open folder" onClick={pickFolder}>
          <FolderOpen className="h-4 w-4" />
        </IconButton>
        <IconButton label="Clear terminal" onClick={clearActive}>
          <Eraser className="h-4 w-4" />
        </IconButton>
        <IconButton label="Command palette" onClick={() => setCommandPalette(true)}>
          <CommandIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Activity and history" onClick={toggleRightPanel} className="relative">
          <PanelRight className="h-4 w-4" />
          {insights.length > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-risk-danger" />
          )}
        </IconButton>
        <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}

function folderName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function displayCwd(cwd: string, home?: string): string {
  if (home && cwd.startsWith(home)) return "~" + cwd.slice(home.length);
  return cwd;
}
