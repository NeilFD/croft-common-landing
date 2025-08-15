import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CMSDashboard from '@/components/cms/CMSDashboard';

const CMS = () => {
  const { user, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isProcessingAuth, setIsProcessingAuth] = useState(true);

  useEffect(() => {
    const processAuthFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const accessToken = params.get('access_token') || hashParams.get('access_token');
      const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
      const code = params.get('code');

      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            await refreshSession();
            // Clean up URL
            window.history.replaceState({}, document.title, '/cms');
          }
        } catch (error) {
          console.error('Error setting session:', error);
        }
      } else if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            await refreshSession();
            // Clean up URL
            window.history.replaceState({}, document.title, '/cms');
          }
        } catch (error) {
          console.error('Error exchanging code:', error);
        }
      }

      setIsProcessingAuth(false);
    };

    processAuthFromUrl();
  }, [refreshSession]);

  useEffect(() => {
    if (!loading && !isProcessingAuth && !user) {
      navigate('/cms/login');
    }
  }, [user, loading, isProcessingAuth, navigate]);

  if (loading || isProcessingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="font-brutalist text-xl mb-2">Loading...</div>
          <div className="font-industrial text-muted-foreground">
            {isProcessingAuth ? 'Processing authentication...' : 'Verifying access'}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <CMSDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default CMS;