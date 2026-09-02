import React from 'react';
import { useTheme, ToastType } from '../../contexts/ThemeContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const toastIcons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles: Record<ToastType, { border: string; bg: string; text: string; iconColor: string }> = {
  success: {
    border: 'border-emerald-200 dark:border-emerald-900',
    bg: 'bg-white dark:bg-stone-900',
    text: 'text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    border: 'border-rose-200 dark:border-rose-900',
    bg: 'bg-white dark:bg-stone-900',
    text: 'text-rose-900 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900',
    bg: 'bg-white dark:bg-stone-900',
    text: 'text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    border: 'border-blue-200 dark:border-blue-900',
    bg: 'bg-white dark:bg-stone-900',
    text: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
      {toasts.map(t => {
        const Icon = toastIcons[t.type];
        const style = toastStyles[t.type];

        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3',
              style.bg,
              style.border
            )}
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', style.iconColor)} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-white leading-tight">
                {t.title}
              </h4>
              {t.description && (
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
