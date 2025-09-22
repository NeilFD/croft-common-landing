import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMembershipCard } from '@/hooks/useMembershipCard';
import { Wallet, RotateCcw, Calendar, User, Hash } from 'lucide-react';
import { format } from 'date-fns';
import CroftLogo from '@/components/CroftLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const MembershipCard = () => {
  const { cardData, loading, error, refetch } = useMembershipCard();
  const [isReissuing, setIsReissuing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddToWallet = async () => {
    if (cardData?.wallet_pass_url && !cardData?.wallet_pass_revoked) {
      // If we already have a valid pass, download it directly
      try {
        const link = document.createElement('a');
        link.href = cardData.wallet_pass_url;
        link.download = `croft-common-membership-${cardData.membership_number}.pkpass`;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Downloading your Apple Wallet pass...');
      } catch (error) {
        console.error('Error opening existing pass:', error);
        toast.error('Failed to download pass. Opening in new tab...');
        // Fallback to opening in new tab
        window.open(cardData.wallet_pass_url, '_blank');
      }
      return;
    }

    // Generate new pass
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to generate your wallet pass');
        return;
      }

      toast.loading('Generating your Apple Wallet pass...', { id: 'wallet-pass-generation' });

      const response = await supabase.functions.invoke('create-wallet-pass', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Error creating wallet pass:', response.error);
        toast.error('Failed to create wallet pass. Please try again.', { id: 'wallet-pass-generation' });
        return;
      }

      // Refresh card data to get the new pass URL
      await refetch();
      
      // Download the new .pkpass file
      if (response.data?.passUrl) {
        try {
          const link = document.createElement('a');
          link.href = response.data.passUrl;
          link.download = `croft-common-membership-${response.data.serialNumber || 'new'}.pkpass`;
          link.target = '_blank';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Apple Wallet pass generated and downloaded successfully!', { id: 'wallet-pass-generation' });
        } catch (error) {
          console.error('Error downloading pass:', error);
          toast.warning('Pass generated but download failed. Opening in new tab...', { id: 'wallet-pass-generation' });
          // Fallback to opening in new tab
          window.open(response.data.passUrl, '_blank');
        }
      } else {
        toast.error('Failed to generate wallet pass URL', { id: 'wallet-pass-generation' });
      }
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

      toast.loading('Reissuing your Apple Wallet pass...', { id: 'wallet-pass-reissue' });

      // First revoke the current pass if it exists
      if (cardData?.wallet_pass_url) {
        const revokeResponse = await supabase.functions.invoke('revoke-wallet-pass', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (revokeResponse.error) {
          console.warn('Error revoking existing pass:', revokeResponse.error);
          // Continue anyway - we'll create a new pass
        }
      }

      // Then create a new pass
      const response = await supabase.functions.invoke('create-wallet-pass', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Error reissuing wallet pass:', response.error);
        toast.error('Failed to reissue wallet pass. Please try again.', { id: 'wallet-pass-reissue' });
        return;
      }

      // Refresh card data
      await refetch();
      
      // Download the new pass if URL is available
      if (response.data?.passUrl) {
        try {
          const link = document.createElement('a');
          link.href = response.data.passUrl;
          link.download = `croft-common-membership-${response.data.serialNumber || 'reissued'}.pkpass`;
          link.target = '_blank';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Apple Wallet pass reissued successfully!', { id: 'wallet-pass-reissue' });
        } catch (error) {
          console.error('Error downloading reissued pass:', error);
          toast.success('Pass reissued successfully!', { id: 'wallet-pass-reissue' });
        }
      } else {
        toast.success('Pass reissued successfully!', { id: 'wallet-pass-reissue' });
      }
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
          {isGenerating ? 'Generating...' : 
           (cardData?.wallet_pass_url && !cardData?.wallet_pass_revoked) ? 
           'Open in Apple Wallet' : 'Add to Apple Wallet'}
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
        
        {cardData?.wallet_pass_revoked && (
          <div className="text-xs text-orange-600 text-center">
            Previous pass revoked - click "Add to Apple Wallet" to generate new
          </div>
        )}
      </div>
    </div>
  );
};