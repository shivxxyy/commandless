/**
 * Lightweight persistence for CommandLess.
 *
 * We use the webview's localStorage, which persists across restarts inside the
 * Tauri window and also works in the plain-browser dev preview. Each domain
 * (settings, history, recipes, layout) lives under its own namespaced key.
 */

const PREFIX = "commandless:";

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage may be full or unavailable; fail quietly.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  settings: "settings",
  onboarding: "onboarding-complete",
  history: "history",
  savedRecipes: "saved-recipes",
  recentFolders: "recent-folders",
  layout: "layout",
} as const;
