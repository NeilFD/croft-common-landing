import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Upload, User, FileText, Flame, Trophy, ArrowLeft, Gamepad2, CalendarDays, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReceiptUploadModal from '@/components/ReceiptUploadModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import PongHighScoresWidget from '@/components/PongHighScoresWidget';
import UpcomingEventsCarousel from '@/components/UpcomingEventsCarousel';
import MemberMomentsCarousel from '@/components/MemberMomentsCarousel';
import PongGame from '@/components/PongGame';
import StreakCalendar from '@/components/StreakCalendar';
import StreakRewardsDashboard from '@/components/StreakRewardsDashboard';

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
  const [showPongGame, setShowPongGame] = useState(false);

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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('/lovable-uploads/5651f236-2692-4b16-a608-b6d821d392ae.png')`
        }}
      />
      
      {/* Scrollable Content */}
      <div className="relative z-10">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 mt-8">
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
          <div className="bg-white rounded-2xl p-6 border-2 border-black">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {memberStats.user.first_name || 'Member'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {memberStats.profile.tier_badge} member since {new Date(memberStats.profile.join_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Member Moments Carousel */}
        <MemberMomentsCarousel />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Weekly Streak System - Larger */}
          <div className="lg:col-span-3 space-y-6">
            {/* Streak Calendar */}
            <StreakCalendar />
            
            {/* Streak Rewards Dashboard */}
            <StreakRewardsDashboard />
          </div>

          {/* Your Space */}
          <div className="lg:col-span-2">
            <Card className="bg-white hover:shadow-lg transition-all duration-300 border-2 border-black hover:border-pink-500">
              <CardHeader>
                <CardTitle className="text-foreground">Your Space</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-6">
                  <Button 
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                    variant="default"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                </div>
                
                <div className="mb-6">
                  <Link to="/common-room/member/ledger">
                    <Button variant="outline" className="w-full hover:bg-pink-500/10 border-2 border-black hover:border-pink-500 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                      <FileText className="h-4 w-4 mr-2" />
                      View Ledger
                    </Button>
                  </Link>
                </div>
                
                <div className="mb-6">
                  <Link to="/common-room/member/moments">
                    <Button variant="outline" className="w-full hover:bg-pink-500/10 border-2 border-black hover:border-pink-500 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                      <Camera className="h-4 w-4 mr-2" />
                      Moments
                    </Button>
                  </Link>
                </div>
                
                <div className="mb-6">
                  <Link to="/common-room/member/profile">
                    <Button variant="outline" className="w-full hover:bg-pink-500/10 border-2 border-black hover:border-pink-500 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Button>
                  </Link>
                </div>

                <div>
                  <Link to="/common-room/member/dashboard">
                    <Button variant="outline" className="w-full hover:bg-pink-500/10 border-2 border-black hover:border-pink-500 hover:text-pink-500 transition-all duration-200 hover:scale-105">
                      <Trophy className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community Widgets - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Pong High Scores Widget - Smaller */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-4 border-2 border-black hover:border-pink-500 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-foreground" />
              <h3 className="text-base font-semibold text-foreground">Pong Champions</h3>
            </div>
            <PongHighScoresWidget onPlayClick={() => setShowPongGame(true)} />
          </div>

          {/* Upcoming Events - Larger */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-black hover:border-pink-500 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>
            </div>
            <UpcomingEventsCarousel />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-white hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-black hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-foreground" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {memberStats.streak.total_check_ins}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-black hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 text-foreground" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                £{memberStats.monthly_spend.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Spend tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-black hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-foreground" />
                Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground capitalize">
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

      {/* Pong Game Modal */}
      {showPongGame && (
        <PongGame onClose={() => setShowPongGame(false)} />
      )}

        <Footer />
      </div>
    </div>
  );
};

export default MemberHome;