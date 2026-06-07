import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label; also used as the hover tooltip. */
  label: string;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, active, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-all duration-150 hover:bg-white/[0.08] hover:text-ink focus-ring disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-white/[0.08] text-ink",
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
