import { useEffect } from 'react';
import '../styles/components/Toast.css';

export interface ToastProps {
  message: string;
  detail?: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, detail, onDismiss, durationMs = 3200 }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [onDismiss, durationMs]);

  return (
    <div className="app-toast" role="status" aria-live="polite">
      <div className="app-toast__inner rounded-2xl bg-white text-gray-900 dark:bg-[var(--ink-900)] dark:text-white border border-gray-200 dark:border-transparent shadow-2xl px-5 py-3 flex flex-col items-center gap-0.5 min-w-[16rem] max-w-[90vw]">
        <span className="text-sm font-semibold">{message}</span>
        {detail && <span className="text-xs text-gray-600 dark:text-white/80 text-center">{detail}</span>}
      </div>
    </div>
  );
}

export default Toast;
