import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../ui/FeedbackStates';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onNavigateToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigateToLogin,
}) => {
  const { profile, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <LoadingState message="Verificando sesión con Supabase..." />
      </div>
    );
  }

  if (!profile) {
    onNavigateToLogin();
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-3">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
          Acceso Restringido
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mb-4">
          Esta sección requiere permisos de Administrador para ser visualizada o modificada.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
