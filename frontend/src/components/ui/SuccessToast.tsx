import { SuccessCheckCircleIcon } from "./icons";

type SuccessToastProps = {
  message: string | null;
  visible: boolean;
};

export function SuccessToast({ message, visible }: SuccessToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed bottom-20 right-4 z-40 flex w-auto max-w-[320px] items-center gap-2 rounded-lg border border-emerald-400 bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-card transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600">
        <SuccessCheckCircleIcon className="h-4 w-4" />
      </span>
      <span>{message}</span>
    </div>
  );
}
