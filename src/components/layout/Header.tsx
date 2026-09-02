import React from 'react';
import { Menu, Plus, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateFull } from '../../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onNavigate,
}) => {
  const { profile, isAdmin } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg lg:text-xl font-bold font-display text-stone-900 dark:text-white tracking-tight">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Today Date pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="capitalize">{formatDateFull(todayStr)}</span>
          </div>

          {/* Quick Action */}
          <button
            onClick={() => onNavigate('/cierre-diario')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs shadow-amber-600/20 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Cierre</span>
            <span className="sm:hidden">Cierre</span>
          </button>
        </div>
      </div>
    </header>
  );
};
