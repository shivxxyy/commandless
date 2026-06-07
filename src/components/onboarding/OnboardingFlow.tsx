import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Terminal,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Check,
  Cloud,
  Server,
  CircleSlash,
  Clock,
} from "lucide-react";
import { useSettingsStore, type SkillLevel } from "@/stores/settingsStore";
import type { AiProviderKind } from "@/lib/ai/types";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";

type AiChoice = AiProviderKind | "later";

export function OnboardingFlow() {
  const update = useSettingsStore((s) => s.update);
  const complete = useSettingsStore((s) => s.completeOnboarding);
  const os = useSettingsStore((s) => s.os);

  const [step, setStep] = useState(0);
  const [skill, setSkill] = useState<SkillLevel>("comfortable");
  const [ai, setAi] = useState<AiChoice>("proxy");
  const [shell, setShell] = useState(os === "windows" ? "powershell" : "zsh");

  const finish = () => {
    update({
      skillLevel: skill,
      aiProvider: ai === "later" ? "proxy" : ai,
      shell,
    });
    complete();
  };

  const next = () => setStep((s) => s + 1);

  const steps = [
    <Welcome key="welcome" onNext={next} />,
    <SkillStep key="skill" value={skill} onChange={setSkill} onNext={next} />,
    <AiStep key="ai" value={ai} onChange={setAi} onNext={next} />,
    <ShellStep
      key="shell"
      os={os}
      value={shell}
      onChange={setShell}
      onNext={next}
    />,
    <SafetyStep key="safety" onFinish={finish} />,
  ];

  return (
    <div className="relative z-10 flex h-full items-center justify-center p-6">
      <div className="glass w-full max-w-xl p-8">
        {/* Progress */}
        <div className="mb-7 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-neon-gradient" : "bg-white/10",
              )}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5 text-center">
      <LogoMark className="mx-auto h-16 w-16" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome to <span className="text-ink">Command</span>
          <span className="text-accent-400">Less</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-accent-400">
          Terminal power. No command memorization.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          Run commands, understand risks, fix errors, and learn what your
          machine is doing.
        </p>
      </div>
      <Button variant="primary" className="mx-auto" onClick={onNext}>
        Get started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
    </div>
  );
}

function OptionRow<T extends string>({
  selected,
  value,
  title,
  description,
  icon,
  onSelect,
}: {
  selected: boolean;
  value: T;
  title: string;
  description: string;
  icon?: React.ReactNode;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
        selected
          ? "border-neon-blue/50 bg-neon-blue/[0.08]"
          : "border-white/10 hover:bg-white/[0.04]",
      )}
    >
      {icon && <span className="text-ink-soft">{icon}</span>}
      <span className="flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-[13px] text-ink-soft">{description}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          selected ? "border-neon-blue bg-neon-blue text-white" : "border-white/20",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

function SkillStep({
  value,
  onChange,
  onNext,
}: {
  value: SkillLevel;
  onChange: (v: SkillLevel) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="How comfortable are you with the terminal?"
        subtitle="This tailors how much explanation CommandLess shows."
      />
      <div className="space-y-2">
        <OptionRow
          selected={value === "beginner"}
          value="beginner"
          title="Beginner"
          description="I rarely use the terminal and want clear guidance."
          onSelect={onChange}
        />
        <OptionRow
          selected={value === "comfortable"}
          value="comfortable"
          title="Comfortable"
          description="I know my way around but appreciate help."
          onSelect={onChange}
        />
        <OptionRow
          selected={value === "power"}
          value="power"
          title="Power user"
          description="I live in the terminal and want speed."
          onSelect={onChange}
        />
      </div>
      <Button variant="primary" className="mt-6 w-full" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

function AiStep({
  value,
  onChange,
  onNext,
}: {
  value: AiChoice;
  onChange: (v: AiChoice) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="Choose how AI helps you"
        subtitle="You can change this anytime in Settings."
      />
      <div className="space-y-2">
        <OptionRow
          selected={value === "none"}
          value="none"
          title="Built-in recipes only"
          description="No AI. CommandLess still understands common intents."
          icon={<CircleSlash className="h-5 w-5" />}
          onSelect={onChange}
        />
        <OptionRow
          selected={value === "proxy"}
          value="proxy"
          title="Cloud AI through CommandLess proxy"
          description="Uses your backend. The API key stays server-side."
          icon={<Cloud className="h-5 w-5" />}
          onSelect={onChange}
        />
        <OptionRow
          selected={value === "local-ollama"}
          value="local-ollama"
          title="Local Ollama"
          description="Runs on your machine. No key required."
          icon={<Server className="h-5 w-5" />}
          onSelect={onChange}
        />
        <OptionRow
          selected={value === "later"}
          value="later"
          title="Configure later"
          description="Start with recipes and set AI up when ready."
          icon={<Clock className="h-5 w-5" />}
          onSelect={onChange}
        />
      </div>
      <Button variant="primary" className="mt-6 w-full" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

function ShellStep({
  os,
  value,
  onChange,
  onNext,
}: {
  os: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const options =
    os === "windows"
      ? [{ id: "powershell", label: "PowerShell", desc: "The Windows default." }]
      : [
          { id: "zsh", label: "zsh", desc: "The modern macOS default." },
          { id: "bash", label: "bash", desc: "Classic and widely compatible." },
        ];
  return (
    <div>
      <StepHeading
        title="Pick your default shell"
        subtitle="New terminals will start with this shell."
      />
      <div className="space-y-2">
        {options.map((o) => (
          <OptionRow
            key={o.id}
            selected={value === o.id}
            value={o.id}
            title={o.label}
            description={o.desc}
            icon={<Terminal className="h-5 w-5" />}
            onSelect={onChange}
          />
        ))}
      </div>
      <Button variant="primary" className="mt-6 w-full" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

function SafetyStep({ onFinish }: { onFinish: () => void }) {
  const promises = [
    {
      icon: <Sparkles className="h-4 w-4 text-neon-violet" />,
      text: "CommandLess always shows the command before AI-suggested actions run.",
    },
    {
      icon: <ShieldCheck className="h-4 w-4 text-risk-danger" />,
      text: "Dangerous commands require extra confirmation.",
    },
    {
      icon: <Terminal className="h-4 w-4 text-neon-blue" />,
      text: "You can use CommandLess as a normal terminal anytime.",
    },
  ];
  return (
    <div>
      <StepHeading title="A quick promise on safety" />
      <div className="space-y-2.5">
        {promises.map((p, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"
          >
            <span className="mt-0.5">{p.icon}</span>
            <p className="text-[13px] leading-relaxed text-ink-soft">{p.text}</p>
          </div>
        ))}
      </div>
      <Button variant="primary" className="mt-6 w-full" onClick={onFinish}>
        Start using CommandLess
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
