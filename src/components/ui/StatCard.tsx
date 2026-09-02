import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'amber' | 'emerald' | 'rose' | 'blue' | 'purple';
  className?: string;
  id?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-stone-200/80 dark:border-stone-800',
    iconBg: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    accent: 'text-stone-900 dark:text-stone-100',
  },
  amber: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-amber-200/80 dark:border-amber-950',
    iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    accent: 'text-amber-800 dark:text-amber-300',
  },
  emerald: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-emerald-200/80 dark:border-emerald-950',
    iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  rose: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-rose-200/80 dark:border-rose-950',
    iconBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
    accent: 'text-rose-700 dark:text-rose-400',
  },
  blue: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-blue-200/80 dark:border-blue-950',
    iconBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    accent: 'text-blue-700 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-white dark:bg-stone-900',
    border: 'border-purple-200/80 dark:border-purple-950',
    iconBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
    accent: 'text-purple-700 dark:text-purple-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  id,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      id={id}
      className={cn(
        'relative p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md duration-200 flex flex-col justify-between',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 tracking-wide uppercase">
            {title}
          </p>
          <div className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-stone-900 dark:text-white">
            {value}
          </div>
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0 flex items-center justify-center', styles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800/80">
        <span>{subtitle || 'Actualizado en tiempo real'}</span>
        {trend && (
          <span
            className={cn(
              'font-medium text-xs px-2 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
