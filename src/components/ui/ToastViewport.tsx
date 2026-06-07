import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore, type ToastKind } from "@/stores/toastStore";

const ICONS: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const COLORS: Record<ToastKind, string> = {
  info: "text-neon-blue",
  success: "text-risk-safe",
  error: "text-risk-danger",
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={() => dismiss(t.id)}
              className="glass pointer-events-auto flex cursor-pointer items-start gap-2.5 p-3 text-sm"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${COLORS[t.kind]}`} />
              <span className="text-ink-soft">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
