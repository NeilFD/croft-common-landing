import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MemberMomentsMosaic from '@/components/MemberMomentsMosaic';
import { useCMSMode } from '@/contexts/CMSModeContext';
import denBg from '@/assets/den-bg-neon.jpg';

const MemberMoments: React.FC = () => {
  const { user, loading } = useAuth();
  const { isCMSMode } = useCMSMode();

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {!isCMSMode && <Navigation />}
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">Loading</div>
        </div>
        {!isCMSMode && <Footer />}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/den" replace />;
  }

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${denBg})`, filter: 'contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/80 -z-10" />

      <div className="relative z-10 text-white">
        {!isCMSMode && <Navigation />}

        <main className="pt-24 md:pt-32 pb-16">
          <div className="container mx-auto px-2 sm:px-4 md:px-6 max-w-7xl">
            <div className="mb-6 md:mb-10 px-2 md:px-0">
              <Link
                to="/den/main"
                className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors"
              >
                ← Back to the Den
              </Link>
            </div>
            <MemberMomentsMosaic />
          </div>
        </main>

        {!isCMSMode && <Footer />}
      </div>
    </div>
  );
};

export default MemberMoments;
