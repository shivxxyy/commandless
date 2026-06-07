import { create } from "zustand";
import type { AiProviderKind } from "@/lib/ai/types";
import type { OsType } from "@/lib/types";
import { defaultAiConfig } from "@/lib/ai";
import { loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage/store";

export type ThemeName = "dark" | "midnight" | "aurora" | "minimal";
export type SkillLevel = "beginner" | "comfortable" | "power";

export interface Settings {
  theme: ThemeName;
  fontSize: number;
  fontFamily: string;
  aiProvider: AiProviderKind;
  proxyUrl: string;
  ollamaUrl: string;
  model: string;
  allowAiCustomCommands: boolean;
  requireConfirmationForAllAi: boolean;
  /** When on, recent terminal output is included in AI requests. */
  shareTerminalOutput: boolean;
  shell: string;
  skillLevel: SkillLevel;
}

interface PersistedSettings extends Settings {
  onboardingComplete: boolean;
}

interface SettingsState extends Settings {
  onboardingComplete: boolean;
  /** Host info, detected at startup (not persisted). */
  os: OsType;
  detectedShell: string;
  home?: string;
  hydrated: boolean;

  setHostInfo: (info: { os: OsType; shell: string; home?: string }) => void;
  update: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const aiDefaults = defaultAiConfig();

const DEFAULTS: PersistedSettings = {
  theme: "midnight",
  fontSize: 14,
  fontFamily: "JetBrains Mono",
  aiProvider: aiDefaults.kind,
  proxyUrl: aiDefaults.proxyUrl,
  ollamaUrl: aiDefaults.ollamaUrl,
  model: aiDefaults.model,
  allowAiCustomCommands: true,
  requireConfirmationForAllAi: false,
  shareTerminalOutput: false,
  shell: "",
  skillLevel: "comfortable",
  onboardingComplete: false,
};

function persist(state: SettingsState) {
  const toSave: PersistedSettings = {
    theme: state.theme,
    fontSize: state.fontSize,
    fontFamily: state.fontFamily,
    aiProvider: state.aiProvider,
    proxyUrl: state.proxyUrl,
    ollamaUrl: state.ollamaUrl,
    model: state.model,
    allowAiCustomCommands: state.allowAiCustomCommands,
    requireConfirmationForAllAi: state.requireConfirmationForAllAi,
    shareTerminalOutput: state.shareTerminalOutput,
    shell: state.shell,
    skillLevel: state.skillLevel,
    onboardingComplete: state.onboardingComplete,
  };
  saveJson(STORAGE_KEYS.settings, toSave);
}

const loaded = loadJson<PersistedSettings>(STORAGE_KEYS.settings, DEFAULTS);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  ...loaded,
  os: "cross-platform",
  detectedShell: "",
  hydrated: false,

  setHostInfo: (info) =>
    set(() => ({
      os: info.os,
      detectedShell: info.shell,
      home: info.home,
      hydrated: true,
    })),

  update: (patch) => {
    set(patch);
    persist(get());
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
    persist(get());
  },

  resetOnboarding: () => {
    set({ onboardingComplete: false });
    persist(get());
  },
}));
