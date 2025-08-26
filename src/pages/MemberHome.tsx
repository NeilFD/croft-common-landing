import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Upload, User, FileText, Flame, Trophy, ArrowLeft, Gamepad2, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReceiptUploadModal from '@/components/ReceiptUploadModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import PongHighScoresWidget from '@/components/PongHighScoresWidget';
import UpcomingEventsCarousel from '@/components/UpcomingEventsCarousel';

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      
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
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-pink-500/10 to-primary/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent mb-2">
              Welcome back, {memberStats.user.first_name || 'Member'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {memberStats.profile.tier_badge} member since {new Date(memberStats.profile.join_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Streak Card - Primary */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-primary/10 via-pink-500/5 to-primary/10 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-pink-500" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent mb-1 flex items-center justify-center gap-3">
                    <Flame className="h-12 w-12 text-orange-500 animate-pulse" />
                    {memberStats.streak.current_streak}
                  </div>
                  <div className="text-xl font-semibold text-pink-500">
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
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                          isCheckedIn 
                            ? 'bg-gradient-to-br from-pink-500 to-primary text-white shadow-sm' 
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>

                {daysUntilPerk > 0 && (
                  <div className="bg-gradient-to-r from-pink-500/10 to-primary/10 rounded-lg p-4 text-center border border-pink-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Next perk in</p>
                    <p className="font-bold text-pink-500 text-lg">
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
            <Card className="hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 border-pink-500/10">
              <CardHeader>
                <CardTitle className="text-pink-500">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-primary hover:from-pink-600 hover:to-primary/90 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                  variant="default"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
                
                <Link to="/common-room/member/ledger">
                  <Button variant="outline" className="w-full hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                    <FileText className="h-4 w-4 mr-2" />
                    View Ledger
                  </Button>
                </Link>
                
                <Link to="/common-room/member/profile">
                  <Button variant="outline" className="w-full hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>

                <Link to="/common-room/member/dashboard">
                  <Button variant="outline" className="w-full hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                    <Trophy className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Pong High Scores Widget */}
          <div className="bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-5 w-5 text-pink-500" />
              <h3 className="text-lg font-semibold text-pink-500">Pong Champions</h3>
            </div>
            <PongHighScoresWidget />
          </div>

          {/* Upcoming Events */}
          <div className="bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-pink-500" />
              <h3 className="text-lg font-semibold text-pink-500">Upcoming Events</h3>
            </div>
            <UpcomingEventsCarousel />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 hover:scale-105 border-pink-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-pink-500" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                {memberStats.streak.total_check_ins}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 hover:scale-105 border-pink-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 text-pink-500" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                £{memberStats.monthly_spend.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Spend tracked</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 hover:scale-105 border-pink-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-pink-500" />
                Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent capitalize">
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

      <Footer />
    </div>
  );
};

export default MemberHome;