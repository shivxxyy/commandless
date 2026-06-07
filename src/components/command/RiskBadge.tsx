import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import type { RiskLevel } from "@/lib/types";
import { RISK_COPY } from "@/lib/risk/classifier";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<
  RiskLevel,
  { wrap: string; icon: typeof ShieldCheck }
> = {
  safe: {
    wrap: "bg-risk-safe/10 text-risk-safe border-risk-safe/25",
    icon: ShieldCheck,
  },
  medium: {
    wrap: "bg-risk-medium/10 text-risk-medium border-risk-medium/25",
    icon: AlertTriangle,
  },
  dangerous: {
    wrap: "bg-risk-danger/10 text-risk-danger border-risk-danger/30",
    icon: ShieldAlert,
  },
};

export function RiskBadge({
  level,
  size = "md",
}: {
  level: RiskLevel;
  size?: "sm" | "md";
}) {
  const { wrap, icon: Icon } = STYLES[level];
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        wrap,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {RISK_COPY[level].label}
    </motion.span>
  );
}
