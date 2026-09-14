import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth,
  size,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveSize = size || maxWidth || 'md';

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal dialog */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthStyles[effectiveSize] || 'max-w-md'} rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl my-auto z-10 animate-in zoom-in-95 duration-200 overflow-hidden text-left flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 px-4 sm:px-6 py-3.5 sm:py-4 bg-zinc-900 shrink-0">
          <div className="pr-4">
            <h2 className="text-base font-semibold text-zinc-100 leading-snug">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-zinc-300 leading-relaxed font-normal">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto text-zinc-100 flex-1">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-zinc-800 bg-zinc-950/60 px-4 sm:px-6 py-3 sm:py-3.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
