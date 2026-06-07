import { create } from "zustand";
import { loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage/store";

interface LayoutPrefs {
  rightPanelCollapsed: boolean;
  sidebarCollapsed: boolean;
}

interface UiState extends LayoutPrefs {
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  shortcutsHelpOpen: boolean;
  /** Intent bus: lets the palette/quick actions feed the intelligence panel. */
  requestedIntent: string | null;
  /** Incremented to trigger the scripted demo reel (for recording). */
  demoNonce: number;

  toggleRightPanel: () => void;
  toggleSidebar: () => void;
  setCommandPalette: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setShortcutsHelp: (open: boolean) => void;
  requestIntent: (intent: string) => void;
  consumeIntent: () => void;
  playDemo: () => void;
}

const layout = loadJson<LayoutPrefs>(STORAGE_KEYS.layout, {
  // The activity drawer starts closed so the workspace stays focused.
  rightPanelCollapsed: true,
  sidebarCollapsed: false,
});

function persistLayout(state: UiState) {
  saveJson(STORAGE_KEYS.layout, {
    rightPanelCollapsed: state.rightPanelCollapsed,
    sidebarCollapsed: state.sidebarCollapsed,
  });
}

export const useUiStore = create<UiState>((set, get) => ({
  ...layout,
  commandPaletteOpen: false,
  settingsOpen: false,
  shortcutsHelpOpen: false,
  requestedIntent: null,
  demoNonce: 0,

  toggleRightPanel: () => {
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed }));
    persistLayout(get());
  },
  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
    persistLayout(get());
  },
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setShortcutsHelp: (open) => set({ shortcutsHelpOpen: open }),
  // The result surfaces in the always-visible intent bar, so we don't open
  // the activity drawer here.
  requestIntent: (intent) => set({ requestedIntent: intent }),
  consumeIntent: () => set({ requestedIntent: null }),
  playDemo: () =>
    set((s) => ({
      demoNonce: s.demoNonce + 1,
      rightPanelCollapsed: true,
      commandPaletteOpen: false,
      settingsOpen: false,
    })),
}));
