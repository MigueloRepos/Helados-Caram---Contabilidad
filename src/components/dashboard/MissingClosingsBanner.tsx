import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Plus,
  ArrowRight,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useMissingClosings } from '../../hooks/useMissingClosings';
import { cn } from '../../lib/utils';

interface MissingClosingsBannerProps {
  onSelectDate: (dateStr: string) => void;
  onNavigateToHistory: () => void;
}

export const MissingClosingsBanner: React.FC<MissingClosingsBannerProps> = ({
  onSelectDate,
  onNavigateToHistory,
}) => {
  const { missingDays, missingCount, urgentCount, dismissDate } = useMissingClosings(14);
  const [isExpanded, setIsExpanded] = useState(true);

  if (missingCount === 0) {
    return null;
  }

  const latestMissing = missingDays[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 dark:border-amber-800/80 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/40 p-5 shadow-sm space-y-4">
      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-600/30 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                Falta registrar el cierre de {missingCount} día{missingCount > 1 ? 's' : ''}
              </h3>
              {urgentCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  {urgentCount} Urgente{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Mantén el control de gastos, ventas y entrega a Frank al día completando los cierres pendientes.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {latestMissing && (
            <button
              onClick={() => onSelectDate(latestMissing.date)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar {latestMissing.relativeText} ({latestMissing.date})</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 text-xs"
            title={isExpanded ? 'Contraer lista' : 'Expandir lista'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded list of missing dates chips */}
      {isExpanded && (
        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-400 px-1">
            <span>Días pendientes por registrar:</span>
            <button
              onClick={onNavigateToHistory}
              className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver historial</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {missingDays.slice(0, 8).map((day) => (
              <div
                key={day.date}
                className={cn(
                  'p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2',
                  day.urgency === 'high'
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        {day.date}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 capitalize block mt-0.5">
                      {day.formattedDate}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md',
                      day.isToday
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        : day.isYesterday
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    )}
                  >
                    {day.relativeText}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => onSelectDate(day.date)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-98"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Registrar</span>
                  </button>
                  <button
                    onClick={() => dismissDate(day.date)}
                    className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    title="Omitir alerta / Día no laborable"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
