import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { closingService } from '../services/closing.service';
import { formatDateFull } from '../lib/utils';

export interface MissingClosingDay {
  date: string; // YYYY-MM-DD
  formattedDate: string;
  relativeText: string;
  daysAgo: number;
  urgency: 'high' | 'medium' | 'low';
  isToday: boolean;
  isYesterday: boolean;
  isDismissed: boolean;
}

const DISMISSED_STORAGE_KEY = 'helados_caram_dismissed_missing_dates';

export function useMissingClosings(daysToCheck: number = 14) {
  const { data: closings = [], isLoading, refetch } = useQuery({
    queryKey: ['daily_closings'],
    queryFn: () => closingService.getDailyClosings(),
  });

  const [dismissedDates, setDismissedDates] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissDate = (date: string) => {
    setDismissedDates((prev) => {
      const next = prev.includes(date) ? prev : [...prev, date];
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Error saving dismissed dates:', err);
      }
      return next;
    });
  };

  const restoreDate = (date: string) => {
    setDismissedDates((prev) => {
      const next = prev.filter((d) => d !== date);
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Error saving dismissed dates:', err);
      }
      return next;
    });
  };

  const clearAllDismissed = () => {
    setDismissedDates([]);
    try {
      localStorage.removeItem(DISMISSED_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing dismissed dates:', err);
    }
  };

  const missingDays = useMemo(() => {
    if (!closings) return [];

    const existingDates = new Set(closings.map((c) => c.closing_date));
    const now = new Date();
    const result: MissingClosingDay[] = [];

    for (let i = 0; i < daysToCheck; i++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!existingDates.has(dateStr)) {
        const isToday = i === 0;
        const isYesterday = i === 1;

        let relativeText = `Hace ${i} días`;
        if (isToday) {
          relativeText = 'Hoy (Pendiente)';
        } else if (isYesterday) {
          relativeText = 'Ayer';
        }

        let urgency: 'high' | 'medium' | 'low' = 'low';
        if (isYesterday || (isToday && now.getHours() >= 17)) {
          urgency = 'high';
        } else if (i <= 3) {
          urgency = 'medium';
        }

        result.push({
          date: dateStr,
          formattedDate: formatDateFull(dateStr),
          relativeText,
          daysAgo: i,
          urgency,
          isToday,
          isYesterday,
          isDismissed: dismissedDates.includes(dateStr),
        });
      }
    }

    return result;
  }, [closings, daysToCheck, dismissedDates]);

  const activeMissingDays = useMemo(() => {
    return missingDays.filter((d) => !d.isDismissed);
  }, [missingDays]);

  const urgentMissingDays = useMemo(() => {
    return activeMissingDays.filter((d) => d.urgency === 'high');
  }, [activeMissingDays]);

  const isTodayPending = useMemo(() => {
    return activeMissingDays.some((d) => d.isToday);
  }, [activeMissingDays]);

  return {
    allMissingDays: missingDays,
    missingDays: activeMissingDays,
    urgentMissingDays,
    missingCount: activeMissingDays.length,
    urgentCount: urgentMissingDays.length,
    hasMissingClosings: activeMissingDays.length > 0,
    isTodayPending,
    isLoading,
    refetch,
    dismissDate,
    restoreDate,
    clearAllDismissed,
  };
}
