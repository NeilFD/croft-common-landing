import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MemberMomentsMosaic from '@/components/MemberMomentsMosaic';
import { useCMSMode } from '@/contexts/CMSModeContext';

const MemberMoments: React.FC = () => {
  const { user, loading } = useAuth();
  const { isCMSMode } = useCMSMode();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen">
        {!isCMSMode && <Navigation />}
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        {!isCMSMode && <Footer />}
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/common-room" replace />;
  }

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      
      <main className="pt-32 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <Link 
              to="/common-room/member" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Member Home
            </Link>
          </div>
          <MemberMomentsMosaic />
        </div>
      </main>
      
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default MemberMoments;