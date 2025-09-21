import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMembershipCard } from '@/hooks/useMembershipCard';
import { Wallet, RotateCcw, Calendar, User, Hash } from 'lucide-react';
import { format } from 'date-fns';

export const MembershipCard = () => {
  const { cardData, loading, error, refetch } = useMembershipCard();
  const [isReissuing, setIsReissuing] = useState(false);

  const handleAddToWallet = () => {
    if (cardData?.wallet_pass_url) {
      window.open(cardData.wallet_pass_url, '_blank');
    } else {
      // TODO: Call create-pass edge function in Phase 3
      console.log('Creating new Apple Wallet pass...');
    }
  };

  const handleReissueCard = async () => {
    setIsReissuing(true);
    try {
      // TODO: Call reissue-pass edge function in Phase 3
      await refetch();
      console.log('Reissuing membership card...');
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

  const displayName = cardData.display_name || `${cardData.first_name || ''} ${cardData.last_name || ''}`.trim();
  const memberSince = cardData.member_since ? format(new Date(cardData.member_since), 'MMM yyyy') : 'Recent';

  return (
    <div className="space-y-4">
      {/* Visual Membership Card */}
      <Card className="border-2 border-black shadow-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden">
        <CardContent className="p-6 relative">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                CROFT COMMON
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">MEMBER</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              ACTIVE
            </Badge>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Member Name */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {displayName || 'Member Name'}
              </p>
            </div>

            {/* Membership Number */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Membership No.
                </span>
              </div>
              <p className="text-lg font-mono font-bold text-foreground tracking-wider">
                {cardData.membership_number || 'Loading...'}
              </p>
            </div>

            {/* Member Since */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member Since
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {memberSince}
              </p>
            </div>
          </div>

          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleAddToWallet}
          className="flex-1 flex items-center gap-2"
          size="lg"
        >
          <Wallet className="h-4 w-4" />
          Add to Apple Wallet
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleReissueCard}
          disabled={isReissuing}
          className="flex items-center gap-2"
          size="lg"
        >
          <RotateCcw className={`h-4 w-4 ${isReissuing ? 'animate-spin' : ''}`} />
          {isReissuing ? 'Reissuing...' : 'Reissue Card'}
        </Button>
      </div>

      {/* Status Info */}
      {cardData.wallet_pass_last_issued_at && (
        <div className="text-xs text-muted-foreground text-center">
          Last issued: {format(new Date(cardData.wallet_pass_last_issued_at), 'PPp')}
        </div>
      )}
    </div>
  );
};