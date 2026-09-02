import React from 'react';
import { DailyClosingForm } from '../components/forms/DailyClosingForm';
import { DailyClosing } from '../types';
import { CalendarCheck, ArrowLeft, History } from 'lucide-react';

interface DailyClosingPageProps {
  editingClosing?: DailyClosing | null;
  onNavigate: (path: string) => void;
  onSuccess: (closing: DailyClosing) => void;
}

export const DailyClosingPage: React.FC<DailyClosingPageProps> = ({
  editingClosing,
  onNavigate,
  onSuccess,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {editingClosing && (
            <button
              onClick={() => onNavigate('/historial')}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50"
              title="Volver al historial"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                {editingClosing ? `Editar Cierre (${editingClosing.closing_date})` : 'Registro de Cierre Diario'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {editingClosing
                ? 'Modifica los valores registrados del cierre contable'
                : 'Ingresa los datos operativos, vasos vendidos, gastos y retiro de Frank del día'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/historial')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 self-start sm:self-auto"
        >
          <History className="w-4 h-4" />
          Ver Historial de Cierres
        </button>
      </div>

      {/* Main Form */}
      <DailyClosingForm
        initialData={editingClosing}
        onSuccess={onSuccess}
        onCancel={() => onNavigate('/dashboard')}
      />
    </div>
  );
};
