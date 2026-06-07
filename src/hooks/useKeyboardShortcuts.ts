import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getTerminal } from "@/lib/terminal/registry";

/** Global keyboard shortcuts. Cmd on macOS, Ctrl elsewhere. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const ui = useUiStore.getState();

      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          ui.setCommandPalette(!ui.commandPaletteOpen);
          break;
        case "t":
          e.preventDefault();
          useTerminalStore.getState().createTab({
            cwd: useSettingsStore.getState().home,
            shell: useSettingsStore.getState().shell,
          });
          break;
        case "j":
          e.preventDefault();
          ui.toggleRightPanel();
          break;
        case ",":
          e.preventDefault();
          ui.setSettingsOpen(true);
          break;
        case "/":
          e.preventDefault();
          ui.setShortcutsHelp(!ui.shortcutsHelpOpen);
          break;
        case "l": {
          // Clear the active terminal (mirrors common terminal behavior).
          e.preventDefault();
          const id = useTerminalStore.getState().activeTabId;
          if (id) getTerminal(id)?.clear();
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
