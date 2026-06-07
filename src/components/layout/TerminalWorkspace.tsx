import { useEffect, useRef } from "react";
import { TerminalSquare } from "lucide-react";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TerminalView } from "@/components/terminal/TerminalView";
import { Button } from "@/components/ui/Button";

export function TerminalWorkspace() {
  const tabs = useTerminalStore((s) => s.tabs);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const createTab = useTerminalStore((s) => s.createTab);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const home = useSettingsStore((s) => s.home);
  const shell = useSettingsStore((s) => s.shell);

  // Open a first terminal automatically once host info is known. The ref guard
  // prevents React StrictMode's double-invoked effect from creating two tabs.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (hydrated && tabs.length === 0 && !autoOpened.current) {
      autoOpened.current = true;
      createTab({ cwd: home, shell });
    }
  }, [hydrated, tabs.length, createTab, home, shell]);

  const running = tabs.some((t) => t.id === activeTabId && t.running);

  return (
    // Bottom padding reserves room so terminal output isn't hidden behind the
    // floating intent bar.
    <div className="h-full w-full px-3 pb-24 pt-3">
      <div
        className={`relative h-full overflow-hidden rounded-xl border border-white/[0.06] bg-graphite-900/60 ${
          running ? "terminal-running" : ""
        }`}
      >
        {tabs.length === 0 ? (
          <EmptyTerminal onNew={() => createTab({ cwd: home, shell })} />
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.id}
              className="absolute inset-0"
              style={{ display: tab.id === activeTabId ? "block" : "none" }}
            >
              <TerminalView tab={tab} active={tab.id === activeTabId} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyTerminal({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-xl bg-white/[0.04] p-4">
        <TerminalSquare className="h-7 w-7 text-accent-400" />
      </div>
      <div>
        <p className="text-base font-medium text-ink">No terminal open</p>
        <p className="mt-1 text-sm text-ink-soft">
          Start a real shell session to run commands.
        </p>
      </div>
      <Button variant="primary" onClick={onNew}>
        Open a terminal
      </Button>
    </div>
  );
}
