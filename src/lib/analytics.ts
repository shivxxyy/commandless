import posthog from "posthog-js";
import { loadJson, saveJson } from "@/lib/storage/store";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Product analytics via PostHog.
 *
 * - No-ops entirely when VITE_POSTHOG_KEY is absent (e.g. local dev).
 * - Identifies an anonymous, randomly-generated install id (no PII).
 * - Respects the "Usage analytics" setting (opt-out).
 * - Geo is derived server-side by PostHog from the request IP.
 *
 * The PostHog project key is a client-side ingestion key (write-only) and is
 * safe to ship inside the app.
 */

export const APP_VERSION = "0.1.0";

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function installId(): string {
  let id = loadJson<string>("install-id", "");
  if (!id) {
    id = uuid();
    saveJson("install-id", id);
  }
  return id;
}

export function initAnalytics(traits: Record<string, unknown>): void {
  if (initialized || !KEY) return;
  try {
    posthog.init(KEY, {
      api_host: HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: "localStorage",
    });
    posthog.identify(installId(), { app_version: APP_VERSION, ...traits });
    if (!useSettingsStore.getState().analyticsEnabled) {
      posthog.opt_out_capturing();
    }
    initialized = true;
  } catch {
    /* analytics must never break the app */
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!initialized || !useSettingsStore.getState().analyticsEnabled) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (!initialized) return;
  try {
    if (enabled) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
  } catch {
    /* ignore */
  }
}
