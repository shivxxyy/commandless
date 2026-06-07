import type { Terminal } from "@xterm/xterm";

/** Handle registered by each mounted TerminalView, keyed by tab id. */
export interface TerminalHandle {
  term: Terminal;
  clear: () => void;
  fit: () => void;
  focus: () => void;
}

const registry = new Map<string, TerminalHandle>();

export function registerTerminal(tabId: string, handle: TerminalHandle) {
  registry.set(tabId, handle);
}

export function unregisterTerminal(tabId: string) {
  registry.delete(tabId);
}

export function getTerminal(tabId: string): TerminalHandle | undefined {
  return registry.get(tabId);
}
