import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMembershipCard } from '@/hooks/useMembershipCard';
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { Wallet, RotateCcw, Calendar, User, Hash } from 'lucide-react';
import { format } from 'date-fns';
import CroftLogo from '@/components/CroftLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';

export const MembershipCard = () => {
  const { cardData, loading, error, refetch } = useMembershipCard();
  const { shouldUseDirectOpen, isCapacitorNative, isPWAStandalone } = useIOSDetection();
  const [isReissuing, setIsReissuing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const openWalletPass = async (passUrl: string) => {
    if (isCapacitorNative) {
      // For Capacitor native apps, use Browser plugin
      await Browser.open({ url: passUrl });
    } else if (isPWAStandalone) {
      // For PWA standalone mode, open in new window
      window.open(passUrl, '_blank');
    } else {
      // For regular Safari, direct navigation
      window.location.assign(passUrl);
    }
  };

  const handleAddToWallet = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to generate your wallet pass');
        return;
      }

      const functionUrl = `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/create-wallet-pass`;

      if (shouldUseDirectOpen) {
        // For iOS devices, directly open the pass URL to trigger native wallet integration
        toast.success('Opening Apple Wallet...', { id: 'wallet-pass-generation' });
        const passUrl = `${functionUrl}?Authorization=${encodeURIComponent(session.access_token)}`;
        await openWalletPass(passUrl);
      } else {
        // For other browsers, download the .pkpass file
        toast.loading('Generating your Apple Wallet pass...', { id: 'wallet-pass-generation' });
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let errorMessage = 'Failed to create wallet pass. Please try again.';
          try {
            const data = await response.json();
            if (data?.error) errorMessage = data.error;
          } catch {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
          console.error('Error creating wallet pass:', errorMessage);
          toast.error(errorMessage, { id: 'wallet-pass-generation' });
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `croft-common-membership-${cardData?.membership_number || 'new'}.pkpass`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Apple Wallet pass downloaded successfully!', { id: 'wallet-pass-generation' });
      }
      
      await refetch();
      
    } catch (error) {
      console.error('Error generating wallet pass:', error);
      toast.error('An unexpected error occurred while generating the wallet pass', { id: 'wallet-pass-generation' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReissueCard = async () => {
    setIsReissuing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to reissue your wallet pass');
        return;
      }

      // First revoke the current pass if it exists
      if (cardData?.wallet_pass_url) {
        const revokeResponse = await supabase.functions.invoke('revoke-wallet-pass', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (revokeResponse.error) {
          console.warn('Error revoking existing pass:', revokeResponse.error);
        }
      }

      const functionUrl = `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/create-wallet-pass`;

      if (shouldUseDirectOpen) {
        // For iOS devices, directly open the pass URL to trigger native wallet integration
        toast.success('Opening Apple Wallet...', { id: 'wallet-pass-reissue' });
        const passUrl = `${functionUrl}?Authorization=${encodeURIComponent(session.access_token)}`;
        await openWalletPass(passUrl);
      } else {
        // For other browsers, download the .pkpass file
        toast.loading('Reissuing your Apple Wallet pass...', { id: 'wallet-pass-reissue' });
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let errorMessage = 'Failed to reissue wallet pass. Please try again.';
          try {
            const data = await response.json();
            if (data?.error) errorMessage = data.error;
          } catch {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
          console.error('Error reissuing wallet pass:', errorMessage);
          toast.error(errorMessage, { id: 'wallet-pass-reissue' });
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `croft-common-membership-${cardData?.membership_number || 'reissued'}.pkpass`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Apple Wallet pass downloaded successfully!', { id: 'wallet-pass-reissue' });
      }

      await refetch();
    } catch (error) {
      console.error('Error reissuing card:', error);
      toast.error('An unexpected error occurred while reissuing the wallet pass', { id: 'wallet-pass-reissue' });
    } finally {
      setIsReissuing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-md animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive shadow-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">Failed to load membership card</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={refetch} size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cardData) {
    return null;
  }

  const fullName = `${cardData.first_name || ''} ${cardData.last_name || ''}`.trim() || cardData.display_name || 'Member Name';
  const memberSince = cardData.member_since ? format(new Date(cardData.member_since), 'MMM yyyy') : 'Recent';

  return (
    <div className="space-y-4">
      {/* Credit Card Size Container */}
      <div className="w-full max-w-md mx-auto">
        <div className="aspect-[1.618/1] w-full">
          <Card className="border-2 border-black shadow-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden h-full">
            <CardContent className="p-6 relative h-full">
              {/* Logo - Absolute positioned in top right corner */}
              <CroftLogo size="lg" className="absolute top-4 right-4 w-16 h-16" enableDevPanel={false} />
              
              {/* Card Header */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-widest text-foreground uppercase">
                  CROFT COMMON
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-1">MEMBERSHIP</p>
              </div>

              {/* Pink Accent Bar */}
              <div className="absolute left-0 top-20 w-full h-1 bg-gradient-to-r from-accent-pink to-accent-pink/60"></div>

              {/* Member Name */}
              <div className="mt-8 mb-6">
                <p className="text-xl font-bold text-foreground leading-tight">
                  {fullName}
                </p>
              </div>

              {/* Membership Number */}
              <div className="mb-6">
                <p className="text-2xl font-mono font-bold text-accent-pink tracking-wider">
                  {cardData.membership_number || 'Loading...'}
                </p>
              </div>

              {/* Member Since - Bottom left */}
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Member Since
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">
                  {memberSince}
                </p>
              </div>

              {/* Active Pill - Bottom Right */}
              <div className="absolute bottom-4 right-4">
                <div className="bg-accent-pink px-2 py-0.5 rounded-full border border-accent-pink/30">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">ACTIVE</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleAddToWallet}
          className="flex-1 flex items-center gap-2"
          size="lg"
          disabled={isGenerating || isReissuing}
        >
          <Wallet className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Add to Apple Wallet'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleReissueCard}
          disabled={isReissuing || isGenerating}
          className="flex items-center gap-2"
          size="lg"
        >
          <RotateCcw className={`h-4 w-4 ${isReissuing ? 'animate-spin' : ''}`} />
          {isReissuing ? 'Reissuing...' : 'Reissue Card'}
        </Button>
      </div>

      {/* Status Info */}
      <div className="space-y-1">
        {cardData.wallet_pass_last_issued_at && (
          <div className="text-xs text-muted-foreground text-center">
            Last issued: {format(new Date(cardData.wallet_pass_last_issued_at), 'PPp')}
          </div>
        )}
        
        {cardData?.wallet_pass_revoked && !cardData?.wallet_pass_url && (
          <div className="text-xs text-orange-600 text-center">
            Previous pass revoked - click "Add to Apple Wallet" to generate new
          </div>
        )}
        
        {cardData?.wallet_pass_revoked && cardData?.wallet_pass_url && (
          <div className="text-xs text-green-600 text-center">
            New pass generated - click "Open in Apple Wallet" to download
          </div>
        )}
      </div>
    </div>
  );
};