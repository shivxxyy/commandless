import { create } from "zustand";
import { nanoid } from "nanoid";

export interface TerminalTab {
  id: string;
  /** Stable PTY session id used with the backend. */
  sessionId: string;
  title: string;
  cwd?: string;
  shell?: string;
  running: boolean;
  exited: boolean;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;

  createTab: (opts?: { title?: string; cwd?: string; shell?: string }) => TerminalTab;
  closeTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  setActiveTab: (id: string) => void;
  setRunning: (id: string, running: boolean) => void;
  setExited: (id: string) => void;
  setCwd: (id: string, cwd: string) => void;
  activeTab: () => TerminalTab | undefined;
}

let counter = 0;

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  createTab: (opts) => {
    counter += 1;
    const tab: TerminalTab = {
      id: nanoid(8),
      sessionId: nanoid(12),
      title: opts?.title ?? `Terminal ${counter}`,
      cwd: opts?.cwd,
      shell: opts?.shell,
      running: false,
      exited: false,
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
    return tab;
  },

  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      let activeTabId = s.activeTabId;
      if (activeTabId === id) {
        const idx = s.tabs.findIndex((t) => t.id === id);
        const next = tabs[idx] ?? tabs[idx - 1] ?? tabs[0];
        activeTabId = next?.id ?? null;
      }
      return { tabs, activeTabId };
    }),

  renameTab: (id, title) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    })),

  setActiveTab: (id) => set({ activeTabId: id }),

  setRunning: (id, running) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, running } : t)),
    })),

  setExited: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, exited: true, running: false } : t,
      ),
    })),

  setCwd: (id, cwd) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, cwd } : t)),
    })),

  activeTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },
}));
