import React from 'react';
import { LucideIcon, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Cargando datos contables...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-3 border-amber-200 dark:border-amber-900 border-t-amber-600 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xs">🍦</span>
      </div>
      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40', className)}>
      <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-3 shadow-xs">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Ha ocurrido un error',
  message = 'No se pudieron sincronizar los datos con la base de datos.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20', className)}>
      <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      )}
    </div>
  );
};
