import Navigation from '@/components/Navigation';
import GestureOverlay from '@/components/GestureOverlay';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { BRAND_LOGO } from '@/data/brand';

const Den = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);

  // Secret gesture goes straight in.
  const handleGestureComplete = () => {
    navigate('/den/main');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>The Den | Crazy Bear</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navigation />
      <main
        ref={containerRef}
        className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Bear watermark */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <img
            src={BRAND_LOGO}
            alt=""
            aria-hidden
            className="w-[28rem] h-[28rem] md:w-[36rem] md:h-[36rem] max-h-[70vh] opacity-[0.08] object-contain grayscale invert"
          />
        </div>

        <div className="relative z-10 text-center">
          <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/60 mb-6">
            Members
          </p>
          <h1 className="font-display uppercase text-6xl md:text-8xl tracking-tight leading-none">
            The Den
          </h1>
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-white/40" />
            <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white">
              Draw a 7
            </p>
            <span className="h-px w-10 bg-white/40" />
          </div>
          <p className="mt-4 font-mono text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/40">
            Find the bear.
          </p>
        </div>
      </main>

      <GestureOverlay
        onGestureComplete={handleGestureComplete}
        containerRef={containerRef}
      />
      <Toaster />
    </div>
  );
};

export default Den;
