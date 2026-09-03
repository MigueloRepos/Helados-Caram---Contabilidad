import React from 'react';
import { ClosingPresentationType, DailyClosing } from '../types';

export interface PresentationConfig {
  id: ClosingPresentationType;
  label: string;
  name: string;
  shortName: string;
  unitLabel: string;
  unitPlural: string;
  unitSingular: string;
  unitPrice: number;
  icon: string;
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const PRICE_PER_CUP = 200; // $200 por vaso individual
export const PRICE_PER_TUB_4_5L = 4000; // $4,000 por tina de 4.5 litros

export const PRESENTATIONS: Record<ClosingPresentationType, PresentationConfig> = {
  cups: {
    id: 'cups',
    label: 'Vasos',
    name: 'Vasos Individuales',
    shortName: 'Vasos',
    unitLabel: 'vasos',
    unitPlural: 'vasos',
    unitSingular: 'vaso',
    unitPrice: PRICE_PER_CUP,
    icon: '🍦',
    description: 'Vasos individuales a $200 c/u',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  tubs_4_5l: {
    id: 'tubs_4_5l',
    label: 'Tinas 4.5L',
    name: 'Tinas de 4.5 Litros',
    shortName: 'Tinas 4.5L',
    unitLabel: 'tinas (4.5L)',
    unitPlural: 'tinas',
    unitSingular: 'tina',
    unitPrice: PRICE_PER_TUB_4_5L,
    icon: '🪣',
    description: 'Tinas de 4.5 Litros a $4,000 c/u',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
  },
};

/**
 * Detects whether a daily closing corresponds to 'cups' ($200) or 'tubs_4_5l' ($4000).
 */
export function getClosingPresentation(closing: Partial<DailyClosing> | null | undefined): ClosingPresentationType {
  if (!closing) return 'cups';

  if (closing.presentation_type === 'tubs_4_5l' || closing.presentation_type === 'cups') {
    return closing.presentation_type;
  }

  const notes = closing.notes || '';
  if (
    notes.includes('[Tipo: Tinas 4.5L]') ||
    notes.includes('[Tinas 4.5L]') ||
    notes.includes('[tinas_4_5l]') ||
    notes.toLowerCase().includes('tinas de 4.5') ||
    notes.toLowerCase().includes('tina de 4.5') ||
    notes.toLowerCase().includes('4.5 litros') ||
    notes.toLowerCase().includes('4.5l')
  ) {
    return 'tubs_4_5l';
  }

  // Check mathematical ratio if total_cups and total_sales exist
  const cups = Number(closing.total_cups || 0);
  const sales = Number(closing.total_sales || 0);
  if (cups > 0 && sales > 0) {
    const ratio = Math.round(sales / cups);
    if (ratio >= 3500 && ratio <= 4500) {
      return 'tubs_4_5l';
    }
  }

  return 'cups';
}

/**
 * Gets presentation config object safely.
 */
export function getPresentationConfig(type?: string | null): PresentationConfig {
  if (type === 'tubs_4_5l') {
    return PRESENTATIONS.tubs_4_5l;
  }
  return PRESENTATIONS.cups;
}

/**
 * Formats a unit count with its appropriate presentation suffix.
 */
export function formatUnitCount(count: number | null | undefined, type?: string | null): string {
  const num = count || 0;
  const config = getPresentationConfig(type);
  const suffix = num === 1 ? config.unitSingular : config.unitPlural;
  return `${num} ${suffix}`;
}

interface PresentationBadgeProps {
  type?: ClosingPresentationType | string | null;
  size?: 'sm' | 'md';
  showPrice?: boolean;
}

export const PresentationBadge: React.FC<PresentationBadgeProps> = ({
  type = 'cups',
  size = 'md',
  showPrice = false,
}) => {
  const config = getPresentationConfig(type);
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText} ${
        isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      title={config.description}
    >
      <span>{config.icon}</span>
      <span>{config.shortName}</span>
      {showPrice && <span className="opacity-80 font-normal">(${config.unitPrice.toLocaleString()})</span>}
    </span>
  );
};

