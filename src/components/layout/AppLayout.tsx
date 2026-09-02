import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileThumbNav } from './MobileThumbNav';
import { SupabaseStatusBanner } from '../supabase/SupabaseStatusBanner';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  title,
  subtitle,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Supabase Status Banner */}
      <SupabaseStatusBanner />

      <div className="flex-1 flex">
        {/* Sidebar for Desktop & Standard Drawer */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          <Header
            title={title}
            subtitle={subtitle}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onNavigate={onNavigate}
          />

          <main className="flex-1 p-4 pb-28 lg:p-8 lg:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Thumb-First Mobile Navigation Bar & Action Sheet */}
      <MobileThumbNav
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
    </div>
  );
};
