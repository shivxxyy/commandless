import { Download, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";
import {
  useSettingsStore,
  type ThemeName,
} from "@/stores/settingsStore";
import { useHistoryStore, exportData } from "@/stores/historyStore";
import { toast } from "@/stores/toastStore";
import { setAnalyticsEnabled } from "@/lib/analytics";
import type { AiProviderKind } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

const THEMES: { value: ThemeName; label: string }[] = [
  { value: "dark", label: "Carbon" },
  { value: "midnight", label: "Forest" },
  { value: "aurora", label: "Emerald" },
  { value: "minimal", label: "Graphite" },
];

const PROVIDERS: { value: AiProviderKind; label: string }[] = [
  { value: "none", label: "Built-in recipes only" },
  { value: "proxy", label: "Cloud AI through CommandLess proxy" },
  { value: "local-ollama", label: "Local Ollama" },
];

const FONTS = ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"];

export function SettingsView() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const s = useSettingsStore();
  const update = useSettingsStore((st) => st.update);
  const resetOnboarding = useSettingsStore((st) => st.resetOnboarding);
  const clearHistory = useHistoryStore((st) => st.clearHistory);

  const doExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commandless-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported recipes and history.");
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings" className="max-w-2xl">
      <div className="max-h-[72vh] space-y-7 overflow-y-auto p-5">
        {/* Appearance */}
        <Group title="Appearance">
          <Field label="Theme">
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update({ theme: t.value })}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[13px] transition-colors",
                    s.theme === t.value
                      ? "border-neon-blue/50 bg-neon-blue/10 text-ink"
                      : "border-white/10 text-ink-soft hover:bg-white/[0.05]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Font size — ${s.fontSize}px`}>
            <input
              type="range"
              min={11}
              max={20}
              value={s.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="w-full accent-neon-blue"
            />
          </Field>
          <Field label="Terminal font family">
            <Select
              value={s.fontFamily}
              onChange={(v) => update({ fontFamily: v })}
              options={FONTS.map((f) => ({ value: f, label: f }))}
            />
          </Field>
        </Group>

        {/* AI */}
        <Group title="AI provider">
          <Field label="Provider">
            <Select
              value={s.aiProvider}
              onChange={(v) => update({ aiProvider: v as AiProviderKind })}
              options={PROVIDERS}
            />
          </Field>
          {s.aiProvider === "proxy" && (
            <Field
              label="Proxy URL"
              hint="Your backend holds the API key. CommandLess never stores it."
            >
              <TextInput
                value={s.proxyUrl}
                placeholder="https://your-domain.com/api/ai"
                onChange={(v) => update({ proxyUrl: v })}
              />
            </Field>
          )}
          {s.aiProvider === "local-ollama" && (
            <>
              <Field label="Local Ollama URL">
                <TextInput
                  value={s.ollamaUrl}
                  placeholder="http://localhost:11434"
                  onChange={(v) => update({ ollamaUrl: v })}
                />
              </Field>
              <Field label="Model name">
                <TextInput
                  value={s.model}
                  placeholder="llama3.1"
                  onChange={(v) => update({ model: v })}
                />
              </Field>
            </>
          )}
          <Toggle
            label="Allow AI to suggest custom commands"
            hint="When off, only built-in recipes are used."
            checked={s.allowAiCustomCommands}
            onChange={(v) => update({ allowAiCustomCommands: v })}
          />
          <Toggle
            label="Require confirmation for all AI commands"
            hint="Always ask before running anything the AI suggests."
            checked={s.requireConfirmationForAllAi}
            onChange={(v) => update({ requireConfirmationForAllAi: v })}
          />
          <Toggle
            label="Let AI see recent terminal output"
            hint="Sends recent output to your AI provider so follow-ups like “export that to a CSV” can use real results. Off by default."
            checked={s.shareTerminalOutput}
            onChange={(v) => update({ shareTerminalOutput: v })}
          />
          <Toggle
            label="Share anonymous usage analytics"
            hint="Helps us understand what people ask and improve CommandLess."
            checked={s.analyticsEnabled}
            onChange={(v) => {
              update({ analyticsEnabled: v });
              setAnalyticsEnabled(v);
            }}
          />
        </Group>

        {/* Shell */}
        <Group title="Shell">
          <Field
            label="Default shell"
            hint={`Detected: ${s.detectedShell || "unknown"}. Leave blank to use the system default.`}
          >
            <TextInput
              value={s.shell}
              placeholder={s.os === "windows" ? "powershell" : "zsh"}
              onChange={(v) => update({ shell: v })}
            />
          </Field>
        </Group>

        {/* Data */}
        <Group title="Data">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={doExport}>
              <Download className="h-3.5 w-3.5" />
              Export recipes and history
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearHistory();
                toast.success("History cleared.");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear history
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetOnboarding();
                setOpen(false);
                toast.info("Onboarding will show again on next launch.");
              }}
            >
              Replay onboarding
            </Button>
          </div>
        </Group>
      </div>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-ink-soft">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-graphite-900/70 px-3 py-2 text-sm text-ink focus-ring"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-graphite-900/70 px-3 py-2 text-sm text-ink focus-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-graphite-850">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-lg py-1 text-left"
    >
      <span>
        <span className="block text-[13px] text-ink">{label}</span>
        {hint && <span className="block text-[11px] text-ink-faint">{hint}</span>}
      </span>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-neon-blue" : "bg-white/10",
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
