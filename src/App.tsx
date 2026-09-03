import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DailyClosingPage } from './pages/DailyClosingPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { FlavorsPage } from './pages/FlavorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DailyClosing } from './types';
import { ClosingDetailModal } from './components/history/ClosingDetailModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { ToastContainer } from './components/ui/ToastContainer';
import { useClosings } from './hooks/useClosings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
      retry: 1,
    },
  },
});

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard General',
    subtitle: 'Resumen financiero, métricas y balances diarios',
  },
  '/cierre-diario': {
    title: 'Cierre Diario',
    subtitle: 'Registro de ventas de vasos, gastos y entrega a Frank',
  },
  '/historial': {
    title: 'Historial de Cierres',
    subtitle: 'Auditoría, filtros y comprobantes contables',
  },
  '/estadisticas': {
    title: 'Estadísticas & Análisis',
    subtitle: 'Gráficos de rendimiento, rotación de sabores y márgenes',
  },
  '/admin/sabores': {
    title: 'Catálogo de Sabores',
    subtitle: 'Gestión de sabores disponibles en Helados Caram',
  },
  '/ajustes': {
    title: 'Ajustes del Sistema',
    subtitle: 'Perfil, conexión con Supabase y preferencias',
  },
};

const MainAppContent: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [editingClosing, setEditingClosing] = useState<DailyClosing | null>(null);
  const [initialClosingDate, setInitialClosingDate] = useState<string | null>(null);
  const [viewingClosing, setViewingClosing] = useState<DailyClosing | null>(null);
  const [closingToDelete, setClosingToDelete] = useState<DailyClosing | null>(null);

  const { deleteClosing, isDeleting } = useClosings();

  // If not logged in, show Login page
  if (!profile) {
    return <LoginPage onLoginSuccess={() => setCurrentPath('/dashboard')} />;
  }

  const handleNavigate = (path: string) => {
    if (path !== '/cierre-diario') {
      setEditingClosing(null);
      setInitialClosingDate(null);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToClosingDate = (dateStr: string) => {
    setEditingClosing(null);
    setInitialClosingDate(dateStr);
    setCurrentPath('/cierre-diario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditClosing = (closing: DailyClosing) => {
    setEditingClosing(closing);
    setInitialClosingDate(null);
    setCurrentPath('/cierre-diario');
  };

  const handleClosingSaved = (closing: DailyClosing) => {
    setEditingClosing(null);
    setInitialClosingDate(null);
    setViewingClosing(closing);
    setCurrentPath('/historial');
  };

  const handleConfirmDelete = async () => {
    if (closingToDelete) {
      await deleteClosing(closingToDelete.id);
      setClosingToDelete(null);
      if (viewingClosing?.id === closingToDelete.id) {
        setViewingClosing(null);
      }
    }
  };

  const meta = pageMeta[currentPath] || {
    title: 'Helados Caram',
    subtitle: 'Sistema de Contabilidad',
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onNavigateToClosingDate={handleNavigateToClosingDate}
      title={meta.title}
      subtitle={meta.subtitle}
    >
      {currentPath === '/dashboard' && (
        <ProtectedRoute onNavigateToLogin={() => setCurrentPath('/login')}>
          <DashboardPage
            onNavigate={handleNavigate}
            onNavigateToClosingDate={handleNavigateToClosingDate}
            onViewClosingDetail={(c) => setViewingClosing(c)}
            onEditClosing={handleEditClosing}
            onDeleteClosing={(c) => setClosingToDelete(c)}
          />
        </ProtectedRoute>
      )}

      {currentPath === '/cierre-diario' && (
        <ProtectedRoute onNavigateToLogin={() => setCurrentPath('/login')}>
          <DailyClosingPage
            editingClosing={editingClosing}
            initialDate={initialClosingDate}
            onNavigate={handleNavigate}
            onSuccess={handleClosingSaved}
          />
        </ProtectedRoute>
      )}

      {currentPath === '/historial' && (
        <ProtectedRoute onNavigateToLogin={() => setCurrentPath('/login')}>
          <HistoryPage
            onNavigate={handleNavigate}
            onNavigateToClosingDate={handleNavigateToClosingDate}
            onEditClosing={handleEditClosing}
          />
        </ProtectedRoute>
      )}

      {currentPath === '/estadisticas' && (
        <ProtectedRoute onNavigateToLogin={() => setCurrentPath('/login')}>
          <StatisticsPage />
        </ProtectedRoute>
      )}

      {currentPath === '/admin/sabores' && (
        <ProtectedRoute allowedRoles={['admin']} onNavigateToLogin={() => setCurrentPath('/login')}>
          <FlavorsPage />
        </ProtectedRoute>
      )}

      {currentPath === '/ajustes' && (
        <ProtectedRoute onNavigateToLogin={() => setCurrentPath('/login')}>
          <SettingsPage />
        </ProtectedRoute>
      )}

      {/* Global Modals for Quick Viewing / Deletion */}
      <ClosingDetailModal
        closing={viewingClosing}
        isOpen={!!viewingClosing}
        onClose={() => setViewingClosing(null)}
        onEdit={(c) => {
          setViewingClosing(null);
          handleEditClosing(c);
        }}
        onDelete={(c) => {
          setViewingClosing(null);
          setClosingToDelete(c);
        }}
        canEdit={true}
      />

      <ConfirmDialog
        isOpen={!!closingToDelete}
        onClose={() => setClosingToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Cierre Diario?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el cierre contable del ${closingToDelete?.closing_date}?`}
        confirmText="Eliminar Cierre"
        isDestructive
        isLoading={isDeleting}
      />
    </AppLayout>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MainAppContent />
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
