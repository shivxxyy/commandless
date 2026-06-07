import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalStore, type TerminalTab } from "@/stores/terminalStore";
import { useHistoryStore } from "@/stores/historyStore";
import { detectError } from "@/lib/errors/explainer";
import {
  isTauri,
  onPtyData,
  onPtyExit,
  ptyClose,
  ptyCreate,
  ptyResize,
  ptyWrite,
} from "@/lib/terminal/ptyClient";
import {
  registerTerminal,
  unregisterTerminal,
} from "@/lib/terminal/registry";
import { appendOutput, clearOutput } from "@/lib/terminal/output";
import { track } from "@/lib/analytics";

const XTERM_THEME = {
  background: "#070a09",
  foreground: "#e6ebe8",
  cursor: "#3fc07d",
  cursorAccent: "#070a09",
  selectionBackground: "rgba(39,163,95,0.30)",
  black: "#161b19",
  red: "#e0625c",
  green: "#34c77b",
  yellow: "#d6a23a",
  blue: "#5b9dd9",
  magenta: "#9a8cd0",
  cyan: "#3fb9a8",
  white: "#9aa6a0",
  brightBlack: "#5f6b65",
  brightRed: "#ef8079",
  brightGreen: "#5fd394",
  brightYellow: "#e6bd5c",
  brightBlue: "#7db4e6",
  brightMagenta: "#b3a6e0",
  brightCyan: "#5fd0c0",
  brightWhite: "#e6ebe8",
};

export function TerminalView({
  tab,
  active,
}: {
  tab: TerminalTab;
  active: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const os = useSettingsStore((s) => s.os);

  // Create the terminal once per tab.
  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({
      fontFamily: `${fontFamily}, JetBrains Mono, Menlo, monospace`,
      fontSize,
      cursorBlink: true,
      allowProposedApi: true,
      theme: XTERM_THEME,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    registerTerminal(tab.id, {
      term,
      clear: () => term.clear(),
      fit: () => fit.fit(),
      focus: () => term.focus(),
    });

    let unlistenData: UnlistenFn | undefined;
    let unlistenExit: UnlistenFn | undefined;
    let disposed = false;

    const setupPty = async () => {
      if (!isTauri()) {
        // Browser preview: no real shell. Provide a clear, honest message.
        term.writeln("\x1b[1;38;5;78mCommandLess\x1b[0m — preview mode");
        term.writeln(
          "\x1b[38;5;245mThe real shell runs in the desktop app (npm run tauri:dev).\x1b[0m",
        );
        term.writeln(
          "\x1b[38;5;245mIntent mode, recipes, risk labels and cards all work here.\x1b[0m\r\n",
        );
        term.write("$ ");
        // Local echo so typing feels alive in the preview.
        let line = "";
        term.onData((d) => {
          if (d === "\r") {
            term.write("\r\n$ ");
            line = "";
          } else if (d === "") {
            if (line.length > 0) {
              line = line.slice(0, -1);
              term.write("\b \b");
            }
          } else {
            line += d;
            term.write(d);
          }
        });
        return;
      }

      const { cols, rows } = term;
      try {
        await ptyCreate({
          sessionId: tab.sessionId,
          cols,
          rows,
          cwd: tab.cwd,
          shell: tab.shell,
        });
      } catch (err) {
        term.writeln(
          `\x1b[38;5;203mFailed to start shell: ${String(err)}\x1b[0m`,
        );
        return;
      }

      // Stream PTY output into the terminal and watch for errors.
      unlistenData = await onPtyData(tab.sessionId, (data) => {
        if (disposed) return;
        term.write(data);
        appendOutput(tab.id, data);
        const pattern = detectError(data);
        if (pattern) {
          track("error_detected", { pattern: pattern.id });
          useHistoryStore.getState().addInsight({
            title: pattern.title,
            whatHappened: pattern.whatHappened,
            likelyCause: pattern.likelyCause,
            suggestedFix: pattern.suggestedFix,
            safeCommand: pattern.safeCommand?.(os),
            matchedPattern: pattern.id,
            fromAi: false,
          });
        }
      });

      unlistenExit = await onPtyExit(tab.sessionId, () => {
        if (disposed) return;
        term.writeln("\r\n\x1b[38;5;245m[process exited]\x1b[0m");
        useTerminalStore.getState().setExited(tab.id);
      });

      // Forward keystrokes to the PTY.
      term.onData((d) => {
        void ptyWrite(tab.sessionId, d);
      });
    };

    void setupPty();

    return () => {
      disposed = true;
      unlistenData?.();
      unlistenExit?.();
      unregisterTerminal(tab.id);
      clearOutput(tab.id);
      if (isTauri()) void ptyClose(tab.sessionId);
      term.dispose();
    };
    // We intentionally create the terminal once per tab; font changes are
    // applied via the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id, tab.sessionId]);

  // Apply live font setting changes.
  useEffect(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term) return;
    term.options.fontSize = fontSize;
    term.options.fontFamily = `${fontFamily}, JetBrains Mono, Menlo, monospace`;
    fit?.fit();
  }, [fontSize, fontFamily]);

  // Resize handling: fit on container resize, then tell the PTY.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const term = termRef.current;
      const fit = fitRef.current;
      if (!term || !fit) return;
      fit.fit();
      if (isTauri()) void ptyResize(tab.sessionId, term.cols, term.rows);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [tab.sessionId]);

  // Refit + focus when this tab becomes active.
  useEffect(() => {
    if (active) {
      fitRef.current?.fit();
      termRef.current?.focus();
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-xl"
      style={{ display: active ? "block" : "none" }}
    />
  );
}
