import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFlavors } from '../../hooks/useFlavors';
import { useClosings } from '../../hooks/useClosings';
import { DailyClosing, DailyClosingFormData, ClosingPresentationType } from '../../types';
import { getTodayDateString, formatCurrency, formatNumber } from '../../lib/utils';
import {
  PRESENTATIONS,
  getClosingPresentation,
  getPresentationConfig,
  formatUnitCount,
  PRICE_PER_CUP,
  PRICE_PER_TUB_4_5L,
} from '../../lib/presentation';
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
  Calculator,
  Zap,
  IceCream,
  X,
  Check,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface DailyClosingFormProps {
  initialData?: DailyClosing | null;
  initialDate?: string | null;
  onSuccess?: (closing: DailyClosing) => void;
  onCancel?: () => void;
}

const POPULAR_FLAVOR_SUGGESTIONS = [
  'Mantecado',
  'Chocolate',
  'Fresa',
  'Vainilla',
  'Coco',
  'Maracuyá',
  'Ron con Pasas',
  'Galleta Oreo',
  'Guanábana',
  'Arequipe / Caramelo',
];

export const DailyClosingForm: React.FC<DailyClosingFormProps> = ({
  initialData,
  initialDate,
  onSuccess,
  onCancel,
}) => {
  const { profile } = useAuth();
  const {
    flavors: availableFlavors,
    isLoading: isLoadingFlavors,
    createFlavor,
    isCreating: isCreatingFlavor,
  } = useFlavors(false);
  const { createClosing, updateClosing, isCreating, isUpdating, closings } = useClosings();

  // Presentation State: 'cups' ($200) vs 'tubs_4_5l' ($4000)
  const [presentationType, setPresentationType] = useState<ClosingPresentationType>(() => {
    if (initialData) {
      return getClosingPresentation(initialData);
    }
    return 'cups';
  });

  const presentationConfig = getPresentationConfig(presentationType);
  const currentPricePerUnit = presentationConfig.unitPrice;

  // Form State
  const [closingDate, setClosingDate] = useState(
    initialData?.closing_date || initialDate || getTodayDateString()
  );

  useEffect(() => {
    if (initialDate && !initialData) {
      setClosingDate(initialDate);
    }
  }, [initialDate, initialData]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [totalCups, setTotalCups] = useState<number | ''>(initialData ? initialData.total_cups : '');
  const [totalSales, setTotalSales] = useState<number | ''>(initialData ? initialData.total_sales : '');
  const [workersSalary, setWorkersSalary] = useState<number | ''>(initialData ? initialData.workers_salary : 0);
  const [deliverySalary, setDeliverySalary] = useState<number | ''>(initialData ? initialData.delivery_salary : 0);
  const [otherExpenses, setOtherExpenses] = useState<number | ''>(initialData ? initialData.other_expenses : 0);
  const [deliveredToFrank, setDeliveredToFrank] = useState<number | ''>(initialData ? initialData.delivered_to_frank : 0);

  // Auto-calculation option state (default enabled for instant unit price calculation)
  const [autoCalc, setAutoCalc] = useState<boolean>(true);

  // Manual Flavor Creator State
  const [isManualFlavorOpen, setIsManualFlavorOpen] = useState(false);
  const [manualFlavorName, setManualFlavorName] = useState('');
  const [manualFlavorQuantity, setManualFlavorQuantity] = useState<number | ''>('');
  const [isSubmittingManualFlavor, setIsSubmittingManualFlavor] = useState(false);
  const [manualFlavorError, setManualFlavorError] = useState<string | null>(null);

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

  // Total units assigned to flavors
  const totalFlavorsCups = selectedFlavors.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const cupsDifference = numCups - totalFlavorsCups;
  const hasCupsDiscrepancy = numCups > 0 && cupsDifference !== 0;

  // Expected calculated sales based on current presentation unit price ($200 or $4000)
  const calculatedSales = numCups * currentPricePerUnit;
  const isSalesMatching = numCups > 0 && numSales === calculatedSales;

  const handlePresentationTypeChange = (newType: ClosingPresentationType) => {
    setPresentationType(newType);
    const newConfig = getPresentationConfig(newType);
    if (autoCalc && typeof totalCups === 'number' && totalCups > 0) {
      setTotalSales(totalCups * newConfig.unitPrice);
    }
  };

  const handleCupsChange = (val: number | '') => {
    setTotalCups(val);
    if (autoCalc) {
      if (typeof val === 'number' && val > 0) {
        setTotalSales(val * currentPricePerUnit);
      } else if (val === '') {
        setTotalSales('');
      }
    }
  };

  const handleApplyCalculation = () => {
    if (typeof totalCups === 'number' && totalCups > 0) {
      setTotalSales(totalCups * currentPricePerUnit);
    }
  };

  const handleSyncFromFlavors = () => {
    if (totalFlavorsCups > 0) {
      setTotalCups(totalFlavorsCups);
      if (autoCalc) {
        setTotalSales(totalFlavorsCups * currentPricePerUnit);
      }
    }
  };

  // Check if date is already registered
  const existingClosingForDate = closings.find(c => c.closing_date === closingDate && c.id !== initialData?.id);

  const handleAddFlavorRow = () => {
    setSelectedFlavors(prev => [...prev, { flavor_id: '', quantity: 0 }]);
  };

  const handleQuickCreateFlavor = async (name: string, targetRowIndex?: number, initialQty?: number) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if it already exists in availableFlavors (case insensitive)
    const existing = availableFlavors.find(f => f.name.toLowerCase() === trimmed.toLowerCase());
    let flavorId = existing?.id;

    if (!flavorId) {
      const res = await createFlavor(trimmed);
      if (res?.data) {
        flavorId = res.data.id;
      } else if (res?.error) {
        throw res.error;
      }
    }

    if (flavorId) {
      if (targetRowIndex !== undefined && targetRowIndex < selectedFlavors.length) {
        setSelectedFlavors(prev => {
          const updated = [...prev];
          updated[targetRowIndex].flavor_id = flavorId!;
          if (typeof initialQty === 'number' && initialQty > 0) {
            updated[targetRowIndex].quantity = initialQty;
          }
          return updated;
        });
      } else {
        setSelectedFlavors(prev => {
          const emptyIdx = prev.findIndex(f => !f.flavor_id);
          if (emptyIdx !== -1) {
            const updated = [...prev];
            updated[emptyIdx] = { flavor_id: flavorId!, quantity: initialQty || 0 };
            return updated;
          }
          return [...prev, { flavor_id: flavorId!, quantity: initialQty || 0 }];
        });
      }
    }
  };

  const handleManualFlavorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualFlavorError(null);
    if (!manualFlavorName.trim()) {
      setManualFlavorError('Por favor escribe el nombre del sabor.');
      return;
    }

    try {
      setIsSubmittingManualFlavor(true);
      const qty = typeof manualFlavorQuantity === 'number' ? manualFlavorQuantity : 0;
      await handleQuickCreateFlavor(manualFlavorName.trim(), undefined, qty);
      setManualFlavorName('');
      setManualFlavorQuantity('');
      setIsManualFlavorOpen(false);
    } catch (err: any) {
      setManualFlavorError(err?.message || 'Error al agregar el sabor');
    } finally {
      setIsSubmittingManualFlavor(false);
    }
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
      setFormError(`Debes ingresar la cantidad total de ${presentationConfig.unitPlural} vendidas (mayor a 0).`);
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
      presentation_type: presentationType,
      unit_price: currentPricePerUnit,
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

      {/* 2. VENTAS DEL DÍA & PRESENTACIÓN */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                2. Ventas del Día
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Selecciona la presentación y registra las unidades despachadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700">
              <input
                type="checkbox"
                checked={autoCalc}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoCalc(checked);
                  if (checked && numCups > 0) {
                    setTotalSales(numCups * currentPricePerUnit);
                  }
                }}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1">
                <Calculator className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Auto-calcular ({presentationConfig.unitPlural} × ${formatNumber(currentPricePerUnit)})
              </span>
            </label>
          </div>
        </div>

        {/* SELECTOR DE TIPO DE PRESENTACIÓN: VASOS ($200) vs TINAS DE 4.5L ($4000) */}
        <div className="p-3.5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Tipo de Cierre / Presentación
            </span>
            <span className="text-[11px] text-stone-500">
              Precio unitario: <strong>{formatCurrency(currentPricePerUnit)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1: Vasos Individuales ($200) */}
            <button
              type="button"
              id="btn-pres-cups"
              onClick={() => handlePresentationTypeChange('cups')}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                presentationType === 'cups'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🍦</span>
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">
                    Vasos Individuales
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Formato estándar por vaso
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-900/60">
                $200 c/u
              </span>
            </button>

            {/* Opción 2: Tinas de 4.5 Litros ($4,000) */}
            <button
              type="button"
              id="btn-pres-tubs"
              onClick={() => handlePresentationTypeChange('tubs_4_5l')}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                presentationType === 'tubs_4_5l'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🪣</span>
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">
                    Tinas de 4.5 Litros
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Cierre mayorista por tina (4.5L)
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60">
                $4,000 c/u
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Cantidad Total de {presentationConfig.label} Vendidas *
              </label>
              <span className="text-[11px] text-stone-400 font-semibold">
                ${formatNumber(currentPricePerUnit)} c/u
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                placeholder={presentationType === 'tubs_4_5l' ? 'Ej: 5 tinas' : 'Ej: 120 vasos'}
                value={totalCups}
                onChange={(e) => handleCupsChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-3.5 pr-20 py-2.5 text-sm font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                {presentationConfig.unitPlural}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Precio Total de las Ventas (USD) *
              </label>
              {numCups > 0 && (
                <button
                  type="button"
                  onClick={handleApplyCalculation}
                  className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                  title={`Recalcular como ${presentationConfig.unitPlural} × $${formatNumber(currentPricePerUnit)}`}
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  Calcular: {numCups} × ${formatNumber(currentPricePerUnit)}
                </button>
              )}
            </div>
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

        {/* Calculation Helper Banner */}
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
            <span className="p-1 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              <Calculator className="w-3.5 h-3.5" />
            </span>
            <span>
              Cálculo: <strong>{formatUnitCount(numCups, presentationType)}</strong> × <strong>${formatNumber(currentPricePerUnit)}</strong> = <strong className="text-emerald-700 dark:text-emerald-400 font-display">{formatCurrency(calculatedSales)}</strong>
            </span>
          </div>

          {!isSalesMatching && numCups > 0 && (
            <button
              type="button"
              onClick={handleApplyCalculation}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-colors"
            >
              <Zap className="w-3 h-3" />
              Aplicar {formatCurrency(calculatedSales)}
            </button>
          )}

          {isSalesMatching && numCups > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Total Cuadrado con ${formatNumber(currentPricePerUnit)}/{presentationConfig.unitSingular}
            </span>
          )}
        </div>
      </div>

      {/* 3. VENTAS POR SABOR */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                3. Ventas por Sabor ({presentationConfig.name})
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Desglose de {presentationConfig.unitPlural} vendidas por cada sabor disponible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualFlavorOpen(!isManualFlavorOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors shadow-2xs"
            >
              <IceCream className="w-3.5 h-3.5 text-amber-600" />
              <span>{isManualFlavorOpen ? 'Ocultar Creador' : '+ Agregar Sabor Manual'}</span>
            </button>

            <span
              className={cn(
                'text-xs font-bold px-3 py-1 rounded-full border',
                cupsDifference === 0 && numCups > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
              )}
            >
              Asignadas: {totalFlavorsCups} / {numCups || 0} {presentationConfig.unitPlural}
            </span>
          </div>
        </div>

        {/* Quick Manual Flavor Creator Panel */}
        {isManualFlavorOpen && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-800/80 space-y-3 transition-all animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                  <IceCream className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                    Crear y Agregar Sabor Manualmente
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Escribe el nombre de un sabor para crearlo y asignarlo de inmediato a este cierre
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualFlavorOpen(false);
                  setManualFlavorError(null);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manualFlavorError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {manualFlavorError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del Sabor *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Chocolate Suizo, Fresa, Coco, Oreo..."
                  value={manualFlavorName}
                  onChange={(e) => setManualFlavorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualFlavorSubmit(e);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {presentationConfig.label} Vendidas (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manualFlavorQuantity}
                  onChange={(e) => setManualFlavorQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleManualFlavorSubmit}
                  disabled={!manualFlavorName.trim() || isSubmittingManualFlavor}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSubmittingManualFlavor ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1.5">
                Sugerencias rápidas (1-clic para agregar):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_FLAVOR_SUGGESTIONS.map((flavorName) => {
                  const alreadySelected = selectedFlavors.some(
                    sf => availableFlavors.find(af => af.id === sf.flavor_id)?.name.toLowerCase() === flavorName.toLowerCase()
                  );
                  return (
                    <button
                      key={flavorName}
                      type="button"
                      disabled={alreadySelected}
                      onClick={() => handleQuickCreateFlavor(flavorName, undefined, 0)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-lg border transition-all inline-flex items-center gap-1',
                        alreadySelected
                          ? 'bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-800/40 dark:text-stone-500 dark:border-stone-800 cursor-not-allowed'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-amber-50 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700 dark:hover:border-amber-600'
                      )}
                    >
                      <Plus className="w-2.5 h-2.5 text-amber-600" />
                      {flavorName} {alreadySelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sync from flavors button if discrepancy */}
        {totalFlavorsCups > 0 && totalFlavorsCups !== numCups && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-700 dark:text-stone-300">
              Suma de sabores: <strong>{formatUnitCount(totalFlavorsCups, presentationType)}</strong> ({formatCurrency(totalFlavorsCups * currentPricePerUnit)})
            </span>
            <button
              type="button"
              onClick={handleSyncFromFlavors}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0"
            >
              Sincronizar con Ventas ({formatUnitCount(totalFlavorsCups, presentationType)})
            </button>
          </div>
        )}

        {/* Warning if discrepancy */}
        {hasCupsDiscrepancy && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Advertencia de cuadre de unidades ({presentationConfig.unitPlural}): </span>
              {cupsDifference > 0 ? (
                <span>
                  Las cantidades por sabor suman <strong>{totalFlavorsCups}</strong> {presentationConfig.unitPlural}, pero el total declarado es <strong>{numCups}</strong> (faltan {cupsDifference} {presentationConfig.unitPlural} por asignar).
                </span>
              ) : (
                <span>
                  Las cantidades por sabor suman <strong>{totalFlavorsCups}</strong> {presentationConfig.unitPlural}, lo cual supera el total de ventas ({numCups} {presentationConfig.unitPlural}).
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
              unitPlaceholder={presentationConfig.label}
              unitLabel={presentationConfig.unitPlural}
              availableFlavors={availableFlavors}
              onFlavorChange={handleFlavorChange}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveFlavorRow}
              isRemovable={selectedFlavors.length > 1}
              onQuickCreateFlavor={handleQuickCreateFlavor}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAddFlavorRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar otra fila
          </button>

          <button
            type="button"
            onClick={() => setIsManualFlavorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
          >
            <IceCream className="w-3.5 h-3.5 text-amber-600" />
            Crear nuevo sabor manualmente
          </button>
        </div>
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
          {initialData ? 'Guardar Cambios del Cierre' : `Registrar Cierre Diario (${presentationConfig.shortName})`}
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
              <span className="text-stone-500 font-medium">Presentación:</span>
              <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <span>{presentationConfig.icon}</span>
                <span>{presentationConfig.name} (${formatNumber(currentPricePerUnit)} c/u)</span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
              <span className="text-stone-500 font-medium">Cantidad Vendida:</span>
              <span className="font-bold text-stone-900 dark:text-white">{formatUnitCount(numCups, presentationType)}</span>
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

