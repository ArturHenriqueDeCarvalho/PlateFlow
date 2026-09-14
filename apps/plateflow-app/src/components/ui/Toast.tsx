import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />,
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-50 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-200 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {icons[type]}
      <span className="font-medium flex-1 leading-snug">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
