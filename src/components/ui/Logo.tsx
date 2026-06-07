import { cn } from "@/lib/utils/cn";

/** The CommandLess mark: a chevron prompt glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="28" height="28" rx="7" fill="#0c0f0e" />
      <rect
        x="0.6"
        y="0.6"
        width="26.8"
        height="26.8"
        rx="6.4"
        stroke="#27a35f"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <path
        d="M8 9.5 L13 14 L8 18.5"
        stroke="#3fc07d"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="15"
        y1="18.6"
        x2="20"
        y2="18.6"
        stroke="#3fc07d"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full wordmark: mark + "Command" (light) + "Less" (green). */
export function Logo({
  className,
  showMark = true,
  size = "md",
}: {
  className?: string;
  showMark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-xl" : size === "sm" ? "text-[13px]" : "text-[15px]";
  const mark = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showMark && <LogoMark className={mark} />}
      <span className={cn("font-semibold tracking-tight", text)}>
        <span className="text-ink">Command</span>
        <span className="text-accent-400">Less</span>
      </span>
    </div>
  );
}
