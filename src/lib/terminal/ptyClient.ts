import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Whether we're running inside the Tauri shell (vs. a plain browser dev preview). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

interface PtyDataPayload {
  sessionId: string;
  data: string;
}

interface PtyExitPayload {
  sessionId: string;
  exitCode: number | null;
}

export async function ptyCreate(opts: {
  sessionId: string;
  cols: number;
  rows: number;
  cwd?: string;
  shell?: string;
}): Promise<void> {
  await invoke("pty_create", {
    sessionId: opts.sessionId,
    cols: opts.cols,
    rows: opts.rows,
    cwd: opts.cwd,
    shell: opts.shell,
  });
}

export async function ptyWrite(sessionId: string, data: string): Promise<void> {
  await invoke("pty_write", { sessionId, data });
}

export async function ptyResize(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  await invoke("pty_resize", { sessionId, cols, rows });
}

export async function ptyClose(sessionId: string): Promise<void> {
  await invoke("pty_close", { sessionId });
}

/** Subscribe to output for a specific session. Returns an unlisten function. */
export async function onPtyData(
  sessionId: string,
  handler: (data: string) => void,
): Promise<UnlistenFn> {
  return listen<PtyDataPayload>("pty://data", (event) => {
    if (event.payload.sessionId === sessionId) {
      handler(event.payload.data);
    }
  });
}

export async function onPtyExit(
  sessionId: string,
  handler: (exitCode: number | null) => void,
): Promise<UnlistenFn> {
  return listen<PtyExitPayload>("pty://exit", (event) => {
    if (event.payload.sessionId === sessionId) {
      handler(event.payload.exitCode);
    }
  });
}
