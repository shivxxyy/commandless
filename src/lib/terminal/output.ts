/**
 * Rolling buffer of recent terminal output per tab.
 *
 * Used by the error explainer (always) and, when the user opts in, to give the
 * AI awareness of recent results so follow-up intents like "export that to a
 * CSV" can act on what was just shown.
 */

const MAX_CHARS = 6000;
const buffers = new Map<string, string>();

export function appendOutput(tabId: string, data: string): void {
  const prev = buffers.get(tabId) ?? "";
  buffers.set(tabId, (prev + data).slice(-MAX_CHARS));
}

export function getOutput(tabId: string, limit = 2000): string {
  return (buffers.get(tabId) ?? "").slice(-limit);
}

export function clearOutput(tabId: string): void {
  buffers.delete(tabId);
}
