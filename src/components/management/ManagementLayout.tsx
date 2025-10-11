import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ManagementSidebar } from './ManagementSidebar';
import CroftLogo from '@/components/CroftLogo';
import { ManagementAIProvider } from '@/contexts/ManagementAIContext';
import { ManagementAIChatWidget } from './ai/ManagementAIChatWidget';
import { SafeAreaTopCap } from '@/components/SafeAreaTopCap';
import AppVersionFooter from '@/components/AppVersionFooter';

interface ManagementLayoutProps {
  children: ReactNode;
}

export const ManagementLayout = ({ children }: ManagementLayoutProps) => {
  const { managementUser, loading } = useManagementAuth();

  // Block management pages during password recovery
  if (typeof window !== 'undefined' && sessionStorage.getItem('recovery') === '1') {
    return <Navigate to="/management/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!managementUser?.hasAccess) {
    return <Navigate to="/management/login" replace />;
  }

  return (
    <ManagementAIProvider>
      <SafeAreaTopCap />
      <SidebarProvider defaultOpen={false}>
        <div 
          className="min-h-screen flex w-full bg-background"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <ManagementSidebar />
          
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <header className="border-t border-b border-industrial bg-background h-12 md:h-16 flex items-center px-3 md:px-4 mt-1 md:mt-2 mx-1 md:mx-2">
              <SidebarTrigger className="mr-2 md:mr-4 h-8 w-8 md:h-10 md:w-10" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <CroftLogo size="sm" className="shrink-0 h-8 w-8 md:h-10 md:w-10" />
                  <h1 className="font-brutalist text-sm md:text-xl font-black uppercase tracking-wider text-foreground">
                    CROFT COMMON
                  </h1>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-12 flex flex-col">
              <div className="max-w-[1600px] mx-auto flex-1 pb-24">
                {children}
              </div>
              
              {/* Footer with Version Info - Sticky at bottom */}
              <footer 
                className="sticky bottom-0 z-10 border-t border-industrial bg-background px-4 py-3 md:px-6" 
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                <AppVersionFooter />
              </footer>
            </main>
          </div>

          {/* AI Chat Widget */}
          <ManagementAIChatWidget />
        </div>
      </SidebarProvider>
    </ManagementAIProvider>
  );
};