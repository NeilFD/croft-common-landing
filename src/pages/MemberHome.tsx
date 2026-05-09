import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReceiptUploadModal from '@/components/ReceiptUploadModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import UpcomingEventsCarousel from '@/components/UpcomingEventsCarousel';
import MemberMomentsCarousel from '@/components/MemberMomentsCarousel';
import TraditionalStreakCalendar from '@/components/TraditionalStreakCalendar';
import { MobileErrorBoundary } from '@/components/MobileErrorBoundary';
import denBg from '@/assets/den-bg.jpg';

interface MemberStats {
  user: { id: string; email: string; first_name: string; last_name: string };
  streak: {
    current_streak: number;
    longest_streak: number;
    total_check_ins: number;
    last_check_in_date: string | null;
  };
  profile: { display_name: string; tier_badge: string; join_date: string };
  recent_checkins: Array<{ check_in_date: string }>;
  recent_visits: Array<any>;
  monthly_spend: number;
  loyalty_card: any;
  insights: any;
}

const chipBase =
  'inline-flex items-center justify-center border border-white/40 text-white px-5 py-2.5 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors touch-manipulation';

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60 mb-4 text-center">
    {children}
  </p>
);

const Hairline: React.FC = () => (
  <div className="w-full flex justify-center my-12">
    <div className="h-px w-16 bg-white/25" />
  </div>
);

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
      navigate('/den/main');
      return;
    }
    if (user) fetchMemberStats();
  }, [user, loading, navigate]);

  const fetchMemberStats = async () => {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase.functions.invoke('member-stats');
      if (error) throw error;
      setMemberStats(data);
    } catch (error) {
      console.error('[MemberHome] Error fetching member stats:', error);
      toast({ title: 'Error', description: 'Failed to load member data', variant: 'destructive' });
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60">Loading</p>
        </div>
      </div>
    );
  }

  if (!memberStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="font-sans text-white/70 mb-4">Couldn't load member data.</p>
          <button onClick={fetchMemberStats} className={chipBase}>Retry</button>
        </div>
      </div>
    );
  }

  const firstName = memberStats.user.first_name || 'Member';
  const totalCheckIns = memberStats.streak?.total_check_ins ?? 0;
  const monthlySpend = memberStats.monthly_spend ?? 0;
  const hasStreakActivity = totalCheckIns > 0 || monthlySpend > 0;

  return (
    <MobileErrorBoundary>
      <div
        className="min-h-screen relative overflow-y-auto"
        style={{
          touchAction: 'pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Fixed B&W Crazy Bear background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${denBg})`, filter: 'grayscale(1) contrast(1.05)' }}
        />
        <div className="fixed inset-0 bg-black/70 -z-10" />

        <div className="relative z-10 text-white">
          {!isCMSMode && <Navigation />}

          <div
            className="container mx-auto px-6 pb-20 max-w-5xl"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}
          >
            {/* Breadcrumb */}
            <div className="mb-10">
              <Link
                to="/den/main"
                className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors"
              >
                ← Back to the Den
              </Link>
            </div>

            {/* Welcome */}
            <div className="text-center mb-12">
              <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70 mb-6">
                Member
              </p>
              <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[0.9] mb-6">
                Welcome, {firstName}
              </h1>
              <p className="font-sans text-base md:text-lg text-white/80 max-w-md mx-auto leading-relaxed">
                Quiet door. Loud nights. Yours.
              </p>
            </div>

            {/* Action chips */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <button onClick={() => setShowReceiptModal(true)} className={chipBase}>
                Upload receipt
              </button>
              <Link to="/den/member/lunch-run" className={chipBase}>Takeaway</Link>
              <Link to="/den/member/moments" className={chipBase}>Moments</Link>
              <Link to="/den/member/profile" className={chipBase}>Profile</Link>
            </div>

            <Hairline />

            {/* Streak block */}
            <Eyebrow>This week</Eyebrow>
            {hasStreakActivity ? (
              <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-6 md:p-8">
                <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-2">Streak</p>
                    <p className="font-display text-3xl md:text-4xl tracking-tight">
                      {memberStats.streak.current_streak}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-2">Visits</p>
                    <p className="font-display text-3xl md:text-4xl tracking-tight">{totalCheckIns}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-2">Spend</p>
                    <p className="font-display text-3xl md:text-4xl tracking-tight">£{monthlySpend.toFixed(0)}</p>
                  </div>
                </div>
                <div className="bg-white text-black p-4 rounded">
                  <TraditionalStreakCalendar />
                </div>
              </div>
            ) : (
              <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-8 md:p-12 text-center">
                <h2 className="font-display uppercase text-3xl md:text-4xl tracking-tight leading-none mb-4">
                  Start your streak
                </h2>
                <p className="font-sans text-white/70 max-w-md mx-auto mb-8">
                  Upload a receipt to log this week. We'll count from here.
                </p>
                <button onClick={() => setShowReceiptModal(true)} className={chipBase}>
                  Upload receipt
                </button>
              </div>
            )}

            <Hairline />

            {/* Upcoming events */}
            <Eyebrow>What's on</Eyebrow>
            <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-4 md:p-6">
              <div className="bg-white text-black p-4 rounded">
                <UpcomingEventsCarousel />
              </div>
            </div>

            <Hairline />

            {/* Moments */}
            <Eyebrow>Moments</Eyebrow>
            <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-4 md:p-6">
              <div className="bg-white text-black p-4 rounded">
                <MemberMomentsCarousel />
              </div>
            </div>
          </div>

          <ReceiptUploadModal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            onSuccess={() => {
              setShowReceiptModal(false);
              fetchMemberStats();
            }}
          />

          <Footer />
        </div>
      </div>
    </MobileErrorBoundary>
  );
};

export default MemberHome;
