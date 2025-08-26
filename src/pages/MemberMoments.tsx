import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageLayout from '@/components/PageLayout';
import MemberMomentsMosaic from '@/components/MemberMomentsMosaic';
import { useCMSMode } from '@/contexts/CMSModeContext';

const MemberMoments: React.FC = () => {
  const { user, loading } = useAuth();
  const { isCMSMode } = useCMSMode();

  // Show loading while checking auth
  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/common-room" replace />;
  }

  return (
    <PageLayout>
      {!isCMSMode && <Navigation />}
      
      <main className="min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <MemberMomentsMosaic />
        </div>
      </main>
      
      {!isCMSMode && <Footer />}
    </PageLayout>
  );
};

export default MemberMoments;