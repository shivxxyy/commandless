import { Modal } from "./Modal";
import { useUiStore } from "@/stores/uiStore";

function isMac() {
  return typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
}

export function ShortcutsHelp() {
  const open = useUiStore((s) => s.shortcutsHelpOpen);
  const setOpen = useUiStore((s) => s.setShortcutsHelp);
  const mod = isMac() ? "⌘" : "Ctrl";

  const shortcuts: { keys: string; label: string }[] = [
    { keys: `${mod} K`, label: "Open command palette" },
    { keys: `${mod} T`, label: "New terminal tab" },
    { keys: `${mod} L`, label: "Clear active terminal" },
    { keys: `${mod} J`, label: "Toggle activity drawer" },
    { keys: `${mod} ,`, label: "Open settings" },
    { keys: `${mod} /`, label: "Show this help" },
    { keys: "Esc", label: "Close dialogs" },
  ];

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts">
      <div className="space-y-1 p-5">
        {shortcuts.map((s) => (
          <div
            key={s.keys}
            className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-white/[0.03]"
          >
            <span className="text-ink-soft">{s.label}</span>
            <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[12px] text-ink">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
