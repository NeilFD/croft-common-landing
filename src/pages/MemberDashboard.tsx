import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, TrendingUp, Calendar, Wallet, Target, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface DashboardStats {
  total_visits: number;
  current_streak: number;
  longest_streak: number;
  monthly_spend: number;
  total_spend: number;
  achievements: any[];
  recent_activity: any[];
}

const MemberDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCMSMode } = useCMSMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/common-room/main');
      return;
    }

    if (user) {
      fetchDashboardStats();
    }
  }, [user, loading, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch member stats
      const { data: memberData, error: memberError } = await supabase.functions.invoke('member-stats');
      if (memberError) throw memberError;

      // Fetch additional dashboard data
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('member_ledger')
        .select('amount, currency, activity_date, activity_type')
        .eq('user_id', user?.id);
      
      if (ledgerError) throw ledgerError;

      const totalSpend = ledgerData
        ?.filter(entry => entry.amount && entry.activity_type === 'receipt')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

      setStats({
        total_visits: memberData.streak.total_check_ins,
        current_streak: memberData.streak.current_streak,
        longest_streak: memberData.streak.longest_streak,
        monthly_spend: memberData.monthly_spend,
        total_spend: totalSpend,
        achievements: [], // Placeholder for future achievements
        recent_activity: ledgerData?.slice(-5) || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load dashboard</p>
          <Button onClick={fetchDashboardStats} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isCMSMode && <Navigation />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/common-room/member" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Member Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Member Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your complete activity overview and achievements
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold text-primary">{stats.total_visits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold text-primary">{stats.current_streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold text-primary">{stats.longest_streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold text-primary">£{stats.total_spend.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Spend</span>
                  <span className="font-semibold text-primary">£{stats.monthly_spend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-semibold text-primary">{stats.current_streak} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Visit Goal</span>
                  <span className="text-sm text-muted-foreground">Set goals in profile</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No achievements yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Keep visiting to unlock rewards!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <Award className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isCMSMode && <Footer />}
    </div>
  );
};

export default MemberDashboard;