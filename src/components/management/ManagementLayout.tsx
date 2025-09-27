import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ManagementSidebar } from './ManagementSidebar';

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
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <ManagementSidebar />
        
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-card h-16 flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <h1 className="text-xl font-bold text-foreground">
                Croft Common – Management
              </h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};