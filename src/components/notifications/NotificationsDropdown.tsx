import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  X,
  EyeOff,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useMissingClosings, MissingClosingDay } from '../../hooks/useMissingClosings';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface NotificationsDropdownProps {
  onNavigateToClosingDate: (dateStr: string) => void;
  onNavigateToHistory: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onNavigateToClosingDate,
  onNavigateToHistory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'dismissed'>('pending');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    allMissingDays,
    missingDays,
    missingCount,
    urgentCount,
    hasMissingClosings,
    dismissDate,
    restoreDate,
    clearAllDismissed,
  } = useMissingClosings(14);

  const dismissedDays = allMissingDays.filter((d) => d.isDismissed);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMissingDate = (dateStr: string) => {
    setIsOpen(false);
    onNavigateToClosingDate(dateStr);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="header-notifications-bell"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-150',
          isOpen
            ? 'bg-amber-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400'
            : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
        )}
        title="Notificaciones y alertas de cierres"
        aria-label="Notificaciones de cierres pendientes"
      >
        <Bell className="w-5 h-5" />

        {/* Counter Badge */}
        {missingCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white shadow-xs animate-in zoom-in-75',
              urgentCount > 0
                ? 'bg-rose-600 ring-2 ring-white dark:ring-stone-900'
                : 'bg-amber-600 ring-2 ring-white dark:ring-stone-900'
            )}
          >
            {missingCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-stone-50/80 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  missingCount > 0
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                )}
              >
                {missingCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                  Alertas de Cierres Contables
                </h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {missingCount > 0
                    ? `${missingCount} día${missingCount > 1 ? 's' : ''} pendiente${missingCount > 1 ? 's' : ''} de registro`
                    : 'Todos los días al día'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-stone-100/70 dark:bg-stone-800/40 border-b border-stone-200/60 dark:border-stone-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
                activeTab === 'pending'
                  ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              <span>Pendientes</span>
              {missingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {missingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dismissed')}
              className={cn(
                'py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
                activeTab === 'dismissed'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              <span>Omitidos / No laborables</span>
              {dismissedDays.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold">
                  {dismissedDays.length}
                </span>
              )}
            </button>
          </div>

          {/* Body Content */}
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80 p-2 space-y-1">
            {activeTab === 'pending' && (
              <>
                {missingDays.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      ¡Contabilidad 100% al día!
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                      No hay ningún día pendiente de cierre en las últimas dos semanas.
                    </p>
                  </div>
                ) : (
                  missingDays.map((item) => (
                    <div
                      key={item.date}
                      className={cn(
                        'p-2.5 rounded-xl transition-colors space-y-2',
                        item.urgency === 'high'
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                              {item.date}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.2 rounded-md',
                                item.isToday
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : item.isYesterday
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              )}
                            >
                              {item.relativeText}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 capitalize">
                            {item.formattedDate}
                          </p>
                        </div>

                        <button
                          onClick={() => dismissDate(item.date)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors text-[10px]"
                          title="Marcar como no laborable / omitir alerta"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSelectMissingDate(item.date)}
                        className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar Cierre de este Día</span>
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'dismissed' && (
              <>
                {dismissedDays.length === 0 ? (
                  <div className="p-6 text-center space-y-1">
                    <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                      No hay días omitidos
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Los días marcados como no laborables aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-1 py-1 text-[10px]">
                      <span className="text-stone-400">Días marcados como no laborables</span>
                      <button
                        onClick={clearAllDismissed}
                        className="text-amber-600 hover:underline font-bold"
                      >
                        Restaurar todos
                      </button>
                    </div>
                    {dismissedDays.map((item) => (
                      <div
                        key={item.date}
                        className="p-2.5 rounded-xl bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            {item.date} ({item.relativeText})
                          </div>
                          <div className="text-[10px] text-stone-400 capitalize">
                            {item.formattedDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => restoreDate(item.date)}
                            className="px-2 py-1 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold hover:bg-stone-300 flex items-center gap-1"
                            title="Restaurar a alertas activas"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Activar
                          </button>
                          <button
                            onClick={() => handleSelectMissingDate(item.date)}
                            className="px-2 py-1 rounded-md bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700"
                          >
                            Registrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer with link to History */}
          <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200/80 dark:border-stone-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateToHistory();
              }}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center justify-center gap-1 mx-auto"
            >
              <span>Ver Historial Completo de Cierres</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
