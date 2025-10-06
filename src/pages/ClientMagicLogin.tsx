import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ClientMagicLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const eventCode = searchParams.get('c');
    const token = searchParams.get('t');

    if (!eventCode || !token) {
      setStatus('error');
      setError('Invalid or missing magic link parameters');
      return;
    }

    const performLogin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('client-magic-login', {
          body: { event_code: eventCode, token }
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Login failed');
        }

        // Store session details
        sessionStorage.setItem('client_session_id', data.sessionId);
        sessionStorage.setItem('client_csrf_token', data.csrfToken);

        setStatus('success');
        toast.success('Login successful');

        // Redirect to portal
        setTimeout(() => {
          navigate(`/p/${eventCode}`);
        }, 1000);
      } catch (err: any) {
        console.error('Magic login error:', err);
        setStatus('error');
        setError(err.message || 'Authentication failed');
        toast.error('Login failed');
      }
    };

    performLogin();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Authenticating...</h1>
          <p className="text-muted-foreground">Please wait while we verify your access</p>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Authentication Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">Possible reasons:</p>
            <ul className="text-sm text-left space-y-1 text-muted-foreground">
              <li>• Link has expired</li>
              <li>• Link has already been used</li>
              <li>• Link has been revoked</li>
              <li>• Invalid link format</li>
            </ul>
          </div>
          <Button onClick={() => navigate('/')} className="w-full mt-6">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 bg-accent-pink rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Login Successful!</h1>
        <p className="text-muted-foreground">Redirecting to your event portal...</p>
      </Card>
    </div>
  );
};

export default ClientMagicLogin;
