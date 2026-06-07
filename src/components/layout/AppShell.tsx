import { TopBar } from "./TopBar";
import { TerminalWorkspace } from "./TerminalWorkspace";
import { HistoryDrawer } from "./HistoryDrawer";
import { IntentBar } from "@/components/command/IntentBar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { SettingsView } from "@/components/settings/SettingsView";
import { ShortcutsHelp } from "@/components/ui/ShortcutsHelp";

export function AppShell() {
  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      <TopBar />

      {/* Work-centric main area: the terminal is the focus. The intent bar
          floats at the bottom; secondary activity lives in a slide-over. */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <TerminalWorkspace />
        <IntentBar />
        <HistoryDrawer />
      </main>

      {/* Overlays */}
      <CommandPalette />
      <SettingsView />
      <ShortcutsHelp />
    </div>
  );
}
