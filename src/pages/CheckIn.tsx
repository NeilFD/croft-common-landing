import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Flame, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/AuthModal';

interface CheckInResult {
  message: string;
  check_in: {
    id: string;
    check_in_date: string;
    entrance_slug: string;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    total_check_ins: number;
  };
}

const CheckIn: React.FC = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const entranceSlug = searchParams.get('entrance');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Show auth modal for anonymous users
        setShowAuthModal(true);
      } else if (entranceSlug) {
        // Process check-in for authenticated users
        processCheckIn();
      } else {
        setError('Invalid check-in link. Missing entrance parameter.');
      }
    }
  }, [user, loading, entranceSlug]);

  const processCheckIn = async () => {
    if (!user || !entranceSlug) return;

    try {
      setProcessing(true);
      setError('');

      const { data, error } = await supabase.functions.invoke('member-checkin', {
        body: {
          entrance_slug: entranceSlug
        }
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Check-in Successful! 🎉",
        description: `Day ${data.streak.current_streak} of your streak!`
      });

    } catch (error: any) {
      console.error('Check-in error:', error);
      setError(error.message || 'Failed to process check-in');
      toast({
        title: "Check-in Failed",
        description: "There was an error processing your check-in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After authentication, the useEffect will trigger check-in
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              to="/common-room/main" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Common Room
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                Member Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {processing && (
                <div>
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Processing Check-In...</h2>
                  <p className="text-muted-foreground">
                    Logging your visit at {entranceSlug}
                  </p>
                </div>
              )}

              {error && (
                <div>
                  <div className="text-destructive text-4xl mb-4">⚠️</div>
                  <h2 className="text-xl font-semibold mb-2 text-destructive">Check-In Failed</h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              )}

              {result && (
                <div>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-xl font-semibold mb-2">Check-In Successful!</h2>
                  
                  <div className="bg-primary/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold">
                        Day {result.streak.current_streak} Streak
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.streak.current_streak}-day streak • {result.streak.total_check_ins} total visits
                    </p>
                    {result.streak.longest_streak > result.streak.current_streak && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Personal best: {result.streak.longest_streak} days
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Link to="/common-room/member">
                      <Button className="w-full">
                        View Member Home
                      </Button>
                    </Link>
                    
                    <Link to="/common-room/main">
                      <Button variant="outline" className="w-full">
                        Back to Common Room
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!processing && !error && !result && !user && (
                <div>
                  <div className="text-4xl mb-4">🔐</div>
                  <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
                  <p className="text-muted-foreground mb-4">
                    Please sign in to complete your check-in at {entranceSlug}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          navigate('/common-room/main');
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default CheckIn;