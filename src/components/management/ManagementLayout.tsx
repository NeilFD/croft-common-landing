import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface ManagementLayoutProps {
  children: ReactNode;
}

export const ManagementLayout = ({ children }: ManagementLayoutProps) => {
  const { managementUser, loading, signOut } = useManagementAuth();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">
              Croft Common – Management
            </h1>
            <div className="text-sm text-muted-foreground capitalize">
              {managementUser.role} Portal
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{managementUser.user.email}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};