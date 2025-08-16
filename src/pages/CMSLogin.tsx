import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AuthModal } from '@/components/AuthModal';

const CMSLogin = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();

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
            window.history.replaceState({}, document.title, '/cms/login');
            navigate('/cms');
            return;
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
            window.history.replaceState({}, document.title, '/cms/login');
            navigate('/cms');
            return;
          }
        } catch (error) {
          console.error('Error exchanging code:', error);
        }
      }

      // Check if user is already authenticated
      if (user) {
        navigate('/cms');
      } else {
        setShowAuthModal(true);
      }
    };

    processAuthFromUrl();
  }, [user, navigate, refreshSession]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/cms');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="font-brutalist text-2xl mb-2">CMS Access</h1>
        <p className="text-muted-foreground font-industrial mb-4">
          Content Management System
        </p>
        {!user && (
          <p className="text-sm text-muted-foreground">
            Redirecting to authentication...
          </p>
        )}
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        requireAllowedDomain={true}
        title="CMS Access"
        description="Enter your email to access the content management system"
        emailSentTitle="Check Your Email"
        emailSentDescription="We've sent you a secure login link to access the CMS"
        redirectUrl={`${window.location.origin}/cms/login`}
      />
    </div>
  );
};

export default CMSLogin;