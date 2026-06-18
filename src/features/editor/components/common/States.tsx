import React from 'react';
import { FileSearch, AlertCircle, Loader2 } from 'lucide-react';

// =========================================================
// LOADING STATE
// =========================================================

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-ink-black border-t-transparent animate-spin" />
      <p className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-widest">
        {message}
      </p>
    </div>
  );
};

// =========================================================
// EMPTY STATE
// =========================================================

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-neutral-300 bg-neutral-50">
      <div className="w-14 h-14 bg-neutral-200 border-2 border-neutral-400 flex items-center justify-center">
        {icon ?? <FileSearch className="w-7 h-7 text-neutral-400" />}
      </div>
      <div className="text-center">
        <h3 className="font-syne font-extrabold text-sm text-neutral-700 uppercase tracking-wide">
          {title}
        </h3>
        {description && (
          <p className="font-sans text-xs text-neutral-500 mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

// =========================================================
// ERROR STATE
// =========================================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-red-300 bg-red-50">
      <div className="w-14 h-14 bg-red-100 border-2 border-red-400 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="font-syne font-extrabold text-sm text-red-700 uppercase tracking-wide">
          {title}
        </h3>
        <p className="font-sans text-xs text-red-500 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white border-2 border-red-700 text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] hover:bg-red-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// =========================================================
// STATUS BADGE
// =========================================================

type BadgeVariant =
  | 'default'
  | 'submitted'
  | 'under_review'
  | 'revision'
  | 'approved'
  | 'sent'
  | 'published'
  | 'active'
  | 'hiatus'
  | 'completed'
  | 'danger'
  | 'warning'
  | 'success';

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  submitted: 'bg-blue-100 text-blue-700 border-blue-300',
  under_review: 'bg-amber-100 text-amber-700 border-amber-300',
  revision: 'bg-orange-100 text-orange-700 border-orange-400',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-400',
  sent: 'bg-purple-100 text-purple-700 border-purple-400',
  published: 'bg-green-100 text-green-700 border-green-400',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-400',
  hiatus: 'bg-yellow-100 text-yellow-700 border-yellow-400',
  completed: 'bg-blue-100 text-blue-700 border-blue-400',
  danger: 'bg-red-100 text-red-700 border-red-400',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-400',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-400',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
}) => {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase tracking-widest border ${badgeStyles[variant]}`}
    >
      {label}
    </span>
  );
};

// =========================================================
// INLINE SPINNER
// =========================================================

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Loader2 className={`${className} animate-spin`} />
);
