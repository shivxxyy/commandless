import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUiStore } from "@/stores/uiStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getHostInfo } from "@/lib/terminal/host";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ToastViewport } from "@/components/ui/ToastViewport";

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const setHostInfo = useSettingsStore((s) => s.setHostInfo);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const setCommandPalette = useUiStore((s) => s.setCommandPalette);
  const [ready, setReady] = useState(false);

  useKeyboardShortcuts();

  // Detect host OS / shell at startup.
  useEffect(() => {
    let cancelled = false;
    getHostInfo().then((info) => {
      if (!cancelled) {
        setHostInfo(info);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setHostInfo]);

  // Apply the selected theme to the document.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the palette when onboarding is showing.
  useEffect(() => {
    if (!onboardingComplete) setCommandPalette(false);
  }, [onboardingComplete, setCommandPalette]);

  return (
    <div className="relative h-full w-full">
      <div className="ambient-bg" />
      {ready && hydrated ? (
        onboardingComplete ? (
          <AppShell />
        ) : (
          <OnboardingFlow />
        )
      ) : (
        <BootSplash />
      )}
      <ToastViewport />
    </div>
  );
}

function BootSplash() {
  return (
    <div className="relative z-10 flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse-glow rounded-xl bg-neon-gradient shadow-glow-blue" />
        <p className="text-sm text-ink-soft">Starting CommandLess…</p>
      </div>
    </div>
  );
}
