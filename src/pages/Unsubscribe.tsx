import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const { toast } = useToast();
  
  const token = searchParams.get('token');

  const handleUnsubscribe = async () => {
    if (!token) {
      toast({
        title: "Invalid link",
        description: "This unsubscribe link is not valid.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('unsubscribe', {
        body: { token }
      });

      if (error) throw error;

      setIsUnsubscribed(true);
      toast({
        title: "Successfully unsubscribed",
        description: "You won't receive any more emails from us.",
      });
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      toast({
        title: "Unsubscribe failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-unsubscribe if token is present
    if (token && !isUnsubscribed) {
      handleUnsubscribe();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-md mx-auto text-center">
          <h1 className="font-brutalist text-3xl mb-8 text-foreground">
            {isUnsubscribed ? 'YOU\'RE OUT' : 'UNSUBSCRIBE'}
          </h1>
          
          {!token ? (
            <div className="space-y-4">
              <p className="font-industrial text-foreground/70">
                This unsubscribe link is not valid. Please use the link from your email.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          ) : isUnsubscribed ? (
            <div className="space-y-4">
              <p className="font-industrial text-foreground/70">
                You've been successfully unsubscribed from Croft Common emails.
                Sorry to see you go.
              </p>
              <p className="font-industrial text-sm text-foreground/50">
                If you change your mind, you can always subscribe again on our website.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-industrial text-foreground/70">
                {isLoading ? 'Processing your request...' : 'Confirming unsubscribe...'}
              </p>
              {isLoading && (
                <div className="animate-spin mx-auto w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full"></div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Unsubscribe;