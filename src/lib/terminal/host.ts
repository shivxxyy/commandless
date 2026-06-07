import { invoke } from "@tauri-apps/api/core";
import type { OsType } from "@/lib/types";
import { isTauri } from "./ptyClient";

export interface HostInfo {
  os: OsType;
  shell: string;
  home?: string;
}

interface RawOsInfo {
  os: string;
  shell: string;
  home: string | null;
}

/** Detect OS in a plain browser (used for the non-Tauri dev preview). */
function browserOs(): OsType {
  if (typeof navigator === "undefined") return "cross-platform";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "cross-platform";
}

/** Get host OS/shell info from the backend, with a browser fallback. */
export async function getHostInfo(): Promise<HostInfo> {
  if (!isTauri()) {
    const os = browserOs();
    return { os, shell: os === "windows" ? "powershell" : "zsh" };
  }
  try {
    const raw = await invoke<RawOsInfo>("get_os_info");
    const os = (["macos", "windows", "linux"].includes(raw.os)
      ? raw.os
      : "cross-platform") as OsType;
    return { os, shell: raw.shell, home: raw.home ?? undefined };
  } catch {
    const os = browserOs();
    return { os, shell: os === "windows" ? "powershell" : "zsh" };
  }
}
