import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  BarChart3,
  IceCream,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  User,
  Plus,
  MoreHorizontal,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface MobileThumbNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileThumbNav: React.FC<MobileThumbNavProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { profile, role, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isThumbSheetOpen, setIsThumbSheetOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsThumbSheetOpen(false);
  };

  const isDashboard = currentPath === '/dashboard';
  const isCierre = currentPath === '/cierre-diario';
  const isHistory = currentPath === '/historial';
  const isStats = currentPath === '/estadisticas';
  const isFlavors = currentPath === '/admin/sabores';
  const isSettings = currentPath === '/ajustes';
  const isMoreActive = isFlavors || isSettings;

  return (
    <>
      {/* Thumb-Zone Bottom Navigation Bar (Fixed for Mobile Screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
        <nav
          aria-label="Navegación pulgar móvil"
          className="pointer-events-auto mx-auto max-w-md bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 rounded-3xl shadow-2xl shadow-stone-900/20 px-2 py-1.5 flex items-center justify-around transition-all"
        >
          {/* 1. Dashboard */}
          <button
            id="mobile-thumb-dashboard"
            onClick={() => handleNav('/dashboard')}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[58px]',
              isDashboard
                ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-colors',
                isDashboard ? 'bg-amber-100/80 dark:bg-amber-950/80' : 'bg-transparent'
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Inicio</span>
          </button>

          {/* 2. Historial */}
          <button
            id="mobile-thumb-history"
            onClick={() => handleNav('/historial')}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[58px]',
              isHistory
                ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-colors',
                isHistory ? 'bg-amber-100/80 dark:bg-amber-950/80' : 'bg-transparent'
              )}
            >
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Historial</span>
          </button>

          {/* 3. Hero Thumb Button (Center Action: Cierre Diario) */}
          <div className="relative -top-4 flex items-center justify-center px-1">
            <button
              id="mobile-thumb-cierre-btn"
              onClick={() => handleNav('/cierre-diario')}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 active:scale-90',
                isCierre
                  ? 'bg-amber-700 text-white ring-4 ring-amber-300/60 dark:ring-amber-900/80 shadow-amber-700/50'
                  : 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-amber-600/40 hover:from-amber-700 hover:to-amber-600'
              )}
              title="Registrar Cierre Diario"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Estadísticas */}
          <button
            id="mobile-thumb-stats"
            onClick={() => handleNav('/estadisticas')}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[58px]',
              isStats
                ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-colors',
                isStats ? 'bg-amber-100/80 dark:bg-amber-950/80' : 'bg-transparent'
              )}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Métricas</span>
          </button>

          {/* 5. Más / Pulgar Sheet */}
          <button
            id="mobile-thumb-more"
            onClick={() => setIsThumbSheetOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[58px]',
              isMoreActive || isThumbSheetOpen
                ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-colors',
                isMoreActive || isThumbSheetOpen ? 'bg-amber-100/80 dark:bg-amber-950/80' : 'bg-transparent'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Menú</span>
          </button>
        </nav>
      </div>

      {/* Thumb-First Bottom Sheet / Action Drawer */}
      {isThumbSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsThumbSheetOpen(false)}
          />

          {/* Bottom Sheet Modal situated right in the Thumb reach zone */}
          <div className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-stone-900 rounded-t-3xl border-t border-stone-200 dark:border-stone-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Grabber indicator */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto" />

            {/* Header with user info */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Usuario'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-amber-300 dark:border-amber-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">
                    {profile?.full_name || 'Usuario'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={isAdmin ? 'amber' : 'blue'}>
                      {isAdmin ? (
                        <>
                          <ShieldCheck className="w-3 h-3" /> ADMINISTRADOR
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" /> FRANK
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsThumbSheetOpen(false)}
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumb-friendly Quick Actions List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1">
                Accesos Directos
              </p>

              {isAdmin && (
                <button
                  onClick={() => handleNav('/admin/sabores')}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all',
                    isFlavors
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-50 dark:bg-stone-800/60 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-xl',
                        isFlavors ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      )}
                    >
                      <IceCream className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">Catálogo de Sabores</div>
                      <div className="text-[10px] opacity-80">Administrar sabores de helados</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              )}

              <button
                onClick={() => handleNav('/ajustes')}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all',
                  isSettings
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-50 dark:bg-stone-800/60 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-xl',
                      isSettings ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Ajustes & Conexión</div>
                    <div className="text-[10px] opacity-80">Perfil, Supabase y Preferencias</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </div>

            {/* Quick Toggle Controls (Theme Toggle & Logout) in natural Thumb Reach */}
            <div className="space-y-2 pt-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-amber-600" />
                    <span>Activar Modo Oscuro</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Activar Modo Claro</span>
                  </>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsThumbSheetOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
