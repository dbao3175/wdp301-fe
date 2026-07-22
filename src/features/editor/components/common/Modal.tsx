import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  actions?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  actions,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="motion-modal fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="motion-modal-backdrop absolute inset-0 bg-ink-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`motion-modal-panel relative w-full ${sizeClasses[size]} bg-white border-2 border-ink-black shadow-[8px_8px_0px_#141414] max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-ink-black bg-ink-black">
          <h2 className="font-syne font-extrabold text-white text-sm uppercase tracking-widest">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer Actions */}
        {actions && (
          <div className="border-t-2 border-ink-black p-4 flex items-center justify-end gap-2 bg-neutral-50">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================
// CONFIRM DIALOG
// =========================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const confirmBtnStyle =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 border-red-700'
      : variant === 'warning'
      ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600'
      : 'bg-ink-black hover:bg-neutral-800 border-ink-black';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm font-sans text-neutral-700 leading-relaxed">{message}</p>
      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border-2 border-ink-black bg-white text-ink-black text-xs font-mono font-extrabold uppercase hover:bg-neutral-50 transition-colors cursor-pointer shadow-[2px_2px_0px_#141414] disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 border-2 ${confirmBtnStyle} text-white text-xs font-mono font-extrabold uppercase transition-colors cursor-pointer shadow-[2px_2px_0px_#141414] disabled:opacity-50`}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
