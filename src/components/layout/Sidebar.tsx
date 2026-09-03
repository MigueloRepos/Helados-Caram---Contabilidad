import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMissingClosings } from '../../hooks/useMissingClosings';
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
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { profile, role, isAdmin, signOut, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { missingCount, urgentCount } = useMissingClosings(14);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'frank'],
    },
    {
      label: 'Cierre Diario',
      path: '/cierre-diario',
      icon: CalendarCheck,
      badge: missingCount > 0 ? `${missingCount} pendiente${missingCount > 1 ? 's' : ''}` : 'Principal',
      isAlert: missingCount > 0,
      roles: ['admin', 'frank'],
    },
    {
      label: 'Historial',
      path: '/historial',
      icon: History,
      roles: ['admin', 'frank'],
    },
    {
      label: 'Estadísticas',
      path: '/estadisticas',
      icon: BarChart3,
      roles: ['admin', 'frank'],
    },
    {
      label: 'Catálogo de Sabores',
      path: '/admin/sabores',
      icon: IceCream,
      adminOnly: true,
      roles: ['admin'],
    },
    {
      label: 'Ajustes',
      path: '/ajustes',
      icon: Settings,
      roles: ['admin', 'frank'],
    },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800 transition-transform duration-300 ease-in-out flex flex-col justify-between',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Logo and Brand */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <span className="text-xl">🍦</span>
              </div>
              <div>
                <h1 className="font-display font-extrabold text-base tracking-tight text-stone-900 dark:text-white leading-tight">
                  HELADOS CARAM
                </h1>
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  Sistema de Contabilidad
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 py-1.5 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Navegación
            </p>
            {navItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
              const isAllowed = !item.adminOnly || isAdmin;
              const Icon = item.icon;

              if (!isAllowed) return null;

              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800/80 hover:text-amber-900 dark:hover:text-amber-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] rounded-full font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.isAlert
                          ? urgentCount > 0
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.adminOnly && !item.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded-md">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile and Utilities */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800/80 space-y-3">
          {/* User Profile Card */}
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Usuario'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-amber-200 dark:border-amber-900 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                  {profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={isAdmin ? 'amber' : 'blue'}>
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3 h-3" /> ADMIN
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

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
