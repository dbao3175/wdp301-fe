import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
}

const variantStyles = {
  default: 'border-ink-black bg-white',
  warning: 'border-yellow-500 bg-yellow-50',
  danger: 'border-red-500 bg-red-50',
  success: 'border-emerald-500 bg-emerald-50',
};

const iconVariantStyles = {
  default: 'bg-ink-black text-white',
  warning: 'bg-yellow-500 text-white',
  danger: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  return (
    <div
      className={`border-2 ${variantStyles[variant]} p-5 shadow-[4px_4px_0px_#141414] relative overflow-hidden ${className}`}
    >
      {/* Decorative halftone pattern */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#141414 1.5px, transparent 1.5px)',
          backgroundSize: '12px 12px',
        }}
      />
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
            {title}
          </p>
          <p className="text-3xl font-black font-syne text-ink-black leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-sans text-neutral-500 mt-1 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-[10px] font-mono font-bold ${
                  trend.value > 0
                    ? 'text-emerald-600'
                    : trend.value < 0
                    ? 'text-red-600'
                    : 'text-neutral-500'
                }`}
              >
                {trend.value > 0 ? '▲' : trend.value < 0 ? '▼' : '─'} {Math.abs(trend.value)}
              </span>
              <span className="text-[10px] font-mono text-neutral-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 ${iconVariantStyles[variant]} flex items-center justify-center border-2 border-ink-black shadow-[2px_2px_0px_#141414] flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
