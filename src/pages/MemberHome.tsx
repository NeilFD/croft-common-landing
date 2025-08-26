import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Upload, User, FileText, Flame, Trophy, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReceiptUploadModal from '@/components/ReceiptUploadModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface MemberStats {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    total_check_ins: number;
    last_check_in_date: string | null;
  };
  profile: {
    display_name: string;
    tier_badge: string;
    join_date: string;
  };
  recent_checkins: Array<{ check_in_date: string }>;
  recent_visits: Array<{
    check_in_date: string;
    check_in_timestamp: string;
    entrance_slug: string;
  }>;
  monthly_spend: number;
  loyalty_card: any;
  insights: any;
}

const MemberHome: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCMSMode } = useCMSMode();
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/common-room/main');
      return;
    }

    if (user) {
      fetchMemberStats();
    }
  }, [user, loading, navigate]);

  const fetchMemberStats = async () => {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase.functions.invoke('member-stats');
      
      if (error) throw error;
      
      setMemberStats(data);
    } catch (error) {
      console.error('Error fetching member stats:', error);
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive"
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const getCheckedInDays = () => {
    if (!memberStats?.recent_checkins) return new Set();
    return new Set(memberStats.recent_checkins.map(c => c.check_in_date));
  };

  const getDaysUntilNextPerk = () => {
    const currentStreak = memberStats?.streak.current_streak || 0;
    const streakMilestones = [3, 7, 14, 30];
    const nextMilestone = streakMilestones.find(milestone => milestone > currentStreak);
    return nextMilestone ? nextMilestone - currentStreak : 0;
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading member area...</p>
        </div>
      </div>
    );
  }

  if (!memberStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load member data</p>
          <Button onClick={fetchMemberStats} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const checkedInDays = getCheckedInDays();
  const daysUntilPerk = getDaysUntilNextPerk();

  return (
    <div className="min-h-screen bg-background">
      {isCMSMode && <Navigation />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/common-room/main" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main Common Room
          </Link>
        </div>

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back, {memberStats.user.first_name || 'Member'}!
          </h1>
          <p className="text-muted-foreground">
            {memberStats.profile.tier_badge} member since {new Date(memberStats.profile.join_date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Streak Card - Primary */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary mb-1">
                    🔥 {memberStats.streak.current_streak}
                  </div>
                  <div className="text-xl font-semibold text-primary">
                    {memberStats.streak.current_streak === 1 ? 'day' : 'days'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Longest streak: {memberStats.streak.longest_streak} days
                  </p>
                </div>

                {/* Mini Calendar */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: 28 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (27 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const isCheckedIn = checkedInDays.has(dateStr);
                    
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded text-xs flex items-center justify-center ${
                          isCheckedIn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>

                {daysUntilPerk > 0 && (
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Next perk in</p>
                    <p className="font-semibold text-primary">
                      {daysUntilPerk} more {daysUntilPerk === 1 ? 'day' : 'days'}
                    </p>
                    <p className="text-xs text-muted-foreground">to unlock special rewards</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full"
                  variant="default"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
                
                <Link to="/common-room/member/ledger">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Ledger
                  </Button>
                </Link>
                
                <Link to="/common-room/member/profile">
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>

                <Link to="/common-room/member/dashboard">
                  <Button variant="outline" className="w-full">
                    <Trophy className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {memberStats.streak.total_check_ins}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                £{memberStats.monthly_spend.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Spend tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Loyalty Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary capitalize">
                {memberStats.profile.tier_badge}
              </div>
              {memberStats.loyalty_card && (
                <p className="text-sm text-muted-foreground">
                  {memberStats.loyalty_card.punches_count}/{memberStats.loyalty_card.punches_required} punches
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Upload Modal */}
      <ReceiptUploadModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSuccess={() => {
          setShowReceiptModal(false);
          fetchMemberStats(); // Refresh stats
        }}
      />

      {isCMSMode && <Footer />}
    </div>
  );
};

export default MemberHome;