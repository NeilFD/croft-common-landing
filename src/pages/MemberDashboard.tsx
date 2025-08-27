import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMemberStats } from '@/hooks/useMemberData';

const MemberDashboard: React.FC = () => {
  const { isCMSMode } = useCMSMode();
  const { stats, loading, error } = useMemberStats();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-8">
        <div className="mb-6">
          <Link 
            to="/common-room/member" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Member Home
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Member Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Your complete activity overview and achievements</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading stats: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalCheckIns}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.currentStreak}</div>
                <p className="text-sm text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.longestStreak}</div>
                <p className="text-sm text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">£{stats.totalSpend.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Monthly Spend</span>
                  <span className="font-semibold">£{stats.monthlySpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Streak</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Flame className="h-4 w-4 text-accent" />
                    {stats.currentStreak} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Visit Goal</span>
                  <span className="text-muted-foreground">Set goals in profile</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No achievements yet</p>
                  <p className="text-sm text-muted-foreground">Keep visiting to unlock rewards!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MemberDashboard;