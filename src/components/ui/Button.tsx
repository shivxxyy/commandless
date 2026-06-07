import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-neon-gradient text-white shadow-glow-blue hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/[0.06] text-ink hover:bg-white/[0.1] border border-white/10",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/[0.06]",
  danger:
    "bg-risk-danger/15 text-risk-danger border border-risk-danger/30 hover:bg-risk-danger/25",
  subtle: "bg-white/[0.04] text-ink-soft hover:text-ink hover:bg-white/[0.08]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring disabled:opacity-40 disabled:pointer-events-none select-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
