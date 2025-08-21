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
      console.log('🔐 CMSLogin: Processing auth from URL:', window.location.href);
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const accessToken = params.get('access_token') || hashParams.get('access_token');
      const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
      const code = params.get('code');
      const error = params.get('error') || hashParams.get('error');
      const errorDescription = params.get('error_description') || hashParams.get('error_description');

      // Handle auth errors
      if (error) {
        console.error('🚨 Auth error from URL:', error, errorDescription);
        setShowAuthModal(true);
        return;
      }

      if (accessToken && refreshToken) {
        console.log('🔐 Found access/refresh tokens, setting session...');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            console.log('✅ Session set successfully');
            await refreshSession();
            // Clean up URL
            window.history.replaceState({}, document.title, '/cms/login');
            navigate('/cms');
            return;
          } else {
            console.error('🚨 Error setting session:', error);
          }
        } catch (error) {
          console.error('🚨 Exception setting session:', error);
        }
      } else if (code) {
        console.log('🔐 Found auth code, exchanging for session...');
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            console.log('✅ Code exchange successful');
            await refreshSession();
            // Clean up URL
            window.history.replaceState({}, document.title, '/cms/login');
            navigate('/cms');
            return;
          } else {
            console.error('🚨 Error exchanging code:', error);
          }
        } catch (error) {
          console.error('🚨 Exception exchanging code:', error);
        }
      }

      // Check if user is already authenticated
      if (user) {
        console.log('✅ User already authenticated, redirecting to CMS');
        navigate('/cms');
      } else {
        console.log('❌ No user found, showing auth modal');
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
      />
    </div>
  );
};

export default CMSLogin;