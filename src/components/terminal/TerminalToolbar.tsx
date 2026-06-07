import { Eraser, FolderOpen, TerminalSquare } from "lucide-react";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { IconButton } from "@/components/ui/IconButton";
import { getTerminal } from "@/lib/terminal/registry";
import { isTauri } from "@/lib/terminal/ptyClient";
import { truncateMiddle } from "@/lib/utils/format";
import { toast } from "@/stores/toastStore";

export function TerminalToolbar() {
  const activeTab = useTerminalStore((s) => s.activeTab());
  const detectedShell = useSettingsStore((s) => s.detectedShell);
  const shellPref = useSettingsStore((s) => s.shell);
  const createTab = useTerminalStore((s) => s.createTab);
  const setCwd = useTerminalStore((s) => s.setCwd);
  const addRecentFolder = useHistoryStore((s) => s.addRecentFolder);
  const home = useSettingsStore((s) => s.home);

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
        // Open a fresh terminal rooted at the chosen folder.
        createTab({ cwd: selected, shell: shellPref, title: folderName(selected) });
        if (activeTab) setCwd(activeTab.id, selected);
        toast.success("Opened a terminal in the selected folder.");
      }
    } catch {
      toast.error("Could not open the folder picker.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-1.5 text-xs text-ink-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <TerminalSquare className="h-3.5 w-3.5 text-ink-faint" />
          {shellName}
        </span>
        {activeTab?.cwd && (
          <span className="inline-flex items-center gap-1.5 text-ink-faint">
            <FolderOpen className="h-3.5 w-3.5" />
            {truncateMiddle(displayCwd(activeTab.cwd, home), 48)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <IconButton label="Open folder" onClick={pickFolder}>
          <FolderOpen className="h-4 w-4" />
        </IconButton>
        <IconButton label="Clear terminal" onClick={clearActive}>
          <Eraser className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
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
