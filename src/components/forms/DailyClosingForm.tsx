import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFlavors } from '../../hooks/useFlavors';
import { useClosings } from '../../hooks/useClosings';
import { DailyClosing, DailyClosingFormData } from '../../types';
import { getTodayDateString, formatCurrency, formatNumber } from '../../lib/utils';
import { FlavorRowItem } from './FlavorRowItem';
import { ClosingSummaryCard } from './ClosingSummaryCard';
import { Modal } from '../ui/Modal';
import {
  Calendar,
  User,
  DollarSign,
  Coffee,
  Plus,
  AlertTriangle,
  FileText,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface DailyClosingFormProps {
  initialData?: DailyClosing | null;
  onSuccess?: (closing: DailyClosing) => void;
  onCancel?: () => void;
}

export const DailyClosingForm: React.FC<DailyClosingFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { profile } = useAuth();
  const { flavors: availableFlavors, isLoading: isLoadingFlavors } = useFlavors(false);
  const { createClosing, updateClosing, isCreating, isUpdating, closings } = useClosings();

  // Form State
  const [closingDate, setClosingDate] = useState(initialData?.closing_date || getTodayDateString());
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [totalCups, setTotalCups] = useState<number | ''>(initialData ? initialData.total_cups : '');
  const [totalSales, setTotalSales] = useState<number | ''>(initialData ? initialData.total_sales : '');
  const [workersSalary, setWorkersSalary] = useState<number | ''>(initialData ? initialData.workers_salary : 0);
  const [deliverySalary, setDeliverySalary] = useState<number | ''>(initialData ? initialData.delivery_salary : 0);
  const [otherExpenses, setOtherExpenses] = useState<number | ''>(initialData ? initialData.other_expenses : 0);
  const [deliveredToFrank, setDeliveredToFrank] = useState<number | ''>(initialData ? initialData.delivered_to_frank : 0);

  // Flavors State
  const [selectedFlavors, setSelectedFlavors] = useState<Array<{ flavor_id: string; quantity: number }>>(() => {
    if (initialData?.flavors && initialData.flavors.length > 0) {
      return initialData.flavors.map(f => ({
        flavor_id: f.flavor_id,
        quantity: f.quantity,
      }));
    }
    return [
      { flavor_id: '', quantity: 0 },
      { flavor_id: '', quantity: 0 },
    ];
  });

  // Set default initial flavors once flavors are loaded if empty
  useEffect(() => {
    if (!initialData && availableFlavors.length > 0 && selectedFlavors.every(f => !f.flavor_id)) {
      const firstActive = availableFlavors.filter(f => f.active).slice(0, 4);
      if (firstActive.length > 0) {
        setSelectedFlavors(firstActive.map(f => ({ flavor_id: f.id, quantity: 0 })));
      }
    }
  }, [availableFlavors, initialData]);

  // Modal confirmation state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculations
  const numCups = typeof totalCups === 'number' ? totalCups : 0;
  const numSales = typeof totalSales === 'number' ? totalSales : 0;
  const numWorkers = typeof workersSalary === 'number' ? workersSalary : 0;
  const numDelivery = typeof deliverySalary === 'number' ? deliverySalary : 0;
  const numOther = typeof otherExpenses === 'number' ? otherExpenses : 0;
  const numDeliveredToFrank = typeof deliveredToFrank === 'number' ? deliveredToFrank : 0;

  const totalExpenses = numWorkers + numDelivery + numOther;
  const balance = numSales - totalExpenses;
  const remainingBalance = balance - numDeliveredToFrank;

  // Total cups assigned to flavors
  const totalFlavorsCups = selectedFlavors.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const cupsDifference = numCups - totalFlavorsCups;
  const hasCupsDiscrepancy = numCups > 0 && cupsDifference !== 0;

  // Check if date is already registered
  const existingClosingForDate = closings.find(c => c.closing_date === closingDate && c.id !== initialData?.id);

  const handleAddFlavorRow = () => {
    setSelectedFlavors(prev => [...prev, { flavor_id: '', quantity: 0 }]);
  };

  const handleFlavorChange = (index: number, flavorId: string) => {
    setSelectedFlavors(prev => {
      const updated = [...prev];
      updated[index].flavor_id = flavorId;
      return updated;
    });
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setSelectedFlavors(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveFlavorRow = (index: number) => {
    setSelectedFlavors(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (numCups <= 0) {
      setFormError('Debes ingresar la cantidad total de vasos vendidos (mayor a 0).');
      return;
    }
    if (numSales <= 0) {
      setFormError('Debes ingresar el total monetario de ventas del día.');
      return;
    }
    if (existingClosingForDate && !initialData) {
      setFormError(`Ya existe un cierre registrado para la fecha ${closingDate}.`);
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleExecuteSave = async () => {
    const validFlavors = selectedFlavors.filter(f => f.flavor_id && f.quantity > 0);

    const formData: DailyClosingFormData = {
      closing_date: closingDate,
      responsable_name: profile?.full_name || 'Responsable',
      notes: notes.trim(),
      total_cups: numCups,
      total_sales: numSales,
      workers_salary: numWorkers,
      delivery_salary: numDelivery,
      other_expenses: numOther,
      delivered_to_frank: numDeliveredToFrank,
      flavors: validFlavors,
    };

    if (initialData) {
      const { error } = await updateClosing({ id: initialData.id, formData });
      if (!error) {
        setIsConfirmModalOpen(false);
        if (onSuccess) onSuccess({ ...initialData, ...formData, total_expenses: totalExpenses, balance, remaining_balance: remainingBalance });
      } else {
        setFormError(error.message);
      }
    } else {
      const { data, error } = await createClosing(formData);
      if (!error && data) {
        setIsConfirmModalOpen(false);
        // Reset form
        setTotalCups('');
        setTotalSales('');
        setWorkersSalary(0);
        setDeliverySalary(0);
        setOtherExpenses(0);
        setDeliveredToFrank(0);
        setNotes('');
        if (onSuccess) onSuccess(data);
      } else if (error) {
        setFormError(error.message);
      }
    }
  };

  return (
    <form onSubmit={handlePreSubmit} className="space-y-6">
      {/* Date Exists Warning Banner */}
      {existingClosingForDate && !initialData && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block text-sm">Ya existe un cierre registrado para esta fecha</span>
            Existe un registro para el día {closingDate}. Puedes cambiar la fecha o editar el cierre existente desde el Historial.
          </div>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* 1. INFORMACIÓN GENERAL */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              1. Información General
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Fecha del cierre contable y datos del responsable
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Fecha del Cierre *
            </label>
            <input
              type="date"
              required
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Responsable
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 text-xs">
              <User className="w-4 h-4 text-amber-600" />
              <span className="font-semibold">{profile?.full_name || 'Usuario Actual'}</span>
              <span className="text-[10px] text-stone-400">({profile?.role?.toUpperCase() || 'FRANK'})</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Notas u Observaciones del Día
          </label>
          <textarea
            rows={2}
            placeholder="Detalles sobre eventos climáticos, pedidos especiales, sobrantes o incidencias..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. VENTAS DEL DÍA */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              2. Ventas del Día
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Total de vasos despachados y monto recaudado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Cantidad Total de Vasos Vendidos *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                placeholder="Ej: 120"
                value={totalCups}
                onChange={(e) => setTotalCups(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-3.5 pr-12 py-2.5 text-sm font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                vasos
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Precio Total de las Ventas (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={totalSales}
                onChange={(e) => setTotalSales(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. VENTAS POR SABOR */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                3. Ventas por Sabor
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Desglose de vasos vendidos por cada sabor disponible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs font-bold px-3 py-1 rounded-full border',
                cupsDifference === 0 && numCups > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
              )}
            >
              Asignados: {totalFlavorsCups} / {numCups || 0} vasos
            </span>
          </div>
        </div>

        {/* Warning if discrepancy */}
        {hasCupsDiscrepancy && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Advertencia de cuadre de vasos: </span>
              {cupsDifference > 0 ? (
                <span>
                  Las cantidades por sabor suman <strong>{totalFlavorsCups}</strong> vasos, pero el total declarado es <strong>{numCups}</strong> (faltan {cupsDifference} vasos por asignar).
                </span>
              ) : (
                <span>
                  Las cantidades por sabor suman <strong>{totalFlavorsCups}</strong> vasos, lo cual supera el total de ventas ({numCups} vasos).
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {selectedFlavors.map((row, index) => (
            <FlavorRowItem
              key={index}
              index={index}
              flavorId={row.flavor_id}
              quantity={row.quantity}
              availableFlavors={availableFlavors}
              onFlavorChange={handleFlavorChange}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveFlavorRow}
              isRemovable={selectedFlavors.length > 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddFlavorRow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar otro sabor
        </button>
      </div>

      {/* 4. GASTOS DEL DÍA */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                4. Gastos del Día
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Salarios del personal, mensajero y compras menores
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
              Total Gastos Calculado
            </span>
            <span className="text-base font-bold font-display text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Salario Trabajadores (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={workersSalary}
                onChange={(e) => setWorkersSalary(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-7 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Salario Mensajero (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={deliverySalary}
                onChange={(e) => setDeliverySalary(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-7 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Otros Gastos (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-7 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. ENTREGADO A FRANK */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              5. Dinero Entregado a Frank
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Retiro de efectivo liquidado directamente a Frank
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Monto Entregado a Frank (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={deliveredToFrank}
              onChange={(e) => setDeliveredToFrank(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 6. RESUMEN AUTOMÁTICO ANTES DE GUARDAR */}
      <ClosingSummaryCard
        totalSales={numSales}
        totalExpenses={totalExpenses}
        deliveredToFrank={numDeliveredToFrank}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={isCreating || isUpdating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all transform active:scale-98 disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {initialData ? 'Guardar Cambios del Cierre' : 'Registrar Cierre Diario'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="¿Confirmar Cierre Diario?"
        description="Por favor verifica los valores contables antes de asentar el cierre en la base de datos."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Fecha:</span>
              <span className="font-bold text-stone-900 dark:text-white">{closingDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Vasos Vendidos:</span>
              <span className="font-bold text-stone-900 dark:text-white">{formatNumber(numCups)} vasos</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Ventas Totales:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(numSales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Total Gastos:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Entregado a Frank:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(numDeliveredToFrank)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-bold pt-2">
              <span className="text-amber-700 dark:text-amber-400">Balance del Día:</span>
              <span className="text-amber-700 dark:text-amber-400">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteSave}
              disabled={isCreating || isUpdating}
              className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
            >
              {isCreating || isUpdating ? 'Guardando en Supabase...' : 'Confirmar y Asentar Cierre'}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
};
