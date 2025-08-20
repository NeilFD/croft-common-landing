import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CroftLogo from '@/components/CroftLogo';
import { preloadImages } from '@/hooks/useImagePreloader';
import { BRAND_LOGO } from '@/data/brand';

interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (path: string, options?: { variant?: 'strobe' | 'soft'; previewSrc?: string }) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};

interface TransitionProviderProps {
  children: React.ReactNode;
}

export const TransitionProvider = ({ children }: TransitionProviderProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState('');
  const [variant, setVariant] = useState<'strobe' | 'soft'>('strobe');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const navigate = useNavigate();

  const triggerTransition = (path: string, options?: { variant?: 'strobe' | 'soft'; previewSrc?: string }) => {
    setTargetPath(path);
    setVariant(options?.variant ?? 'strobe');
    setPreviewSrc(options?.previewSrc ?? null);
    setIsTransitioning(true);
  };

  // Strobe + logo transition implementation
  const [phase, setPhase] = useState<'idle' | 'strobe' | 'logo' | 'soft-logo' | 'soft-image'>('idle');
  const [strobeOn, setStrobeOn] = useState(false);
  const timersRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const logoShownRef = useRef(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Transition timing constants
  const STROBE_TOGGLE_MS = 166; // 3Hz max (toggle interval ~166ms; full cycle ~333ms)
  const STROBE_DURATION_MS = 500; // single short strobe window
  const LOGO_DISPLAY_MS = 900; // show logo long enough to see

  // Soft transition timing (mobile-friendly)
  const SOFT_LOGO_INTRO_MS = 900; // show logo long enough to see
  const SOFT_FADE_TO_IMAGE_MS = 1400; // crossfade duration to image (unused now)
  const SOFT_EXTRA_HOLD_MS = 200; // hold before hiding overlay

  // Overlay/reveal timing (mobile-optimized)
  const OVERLAY_FADE_OUT_MS = 600; // smoother fade-out of overlay
  const REVEAL_AFTER_NAV_MS = 300; // longer wait on mobile for navigation completion

  const TEXTURE_URL = '/lovable-uploads/d1fb9178-8f7e-47fb-a8ac-71350264d76f.png';

  useEffect(() => {
    if (!isTransitioning) return;

    setOverlayVisible(true);

    // Reset single-logo guard for this transition
    logoShownRef.current = false;

    // Preload assets for a seamless effect
    preloadImages([TEXTURE_URL, BRAND_LOGO]);
    if (previewSrc) preloadImages([previewSrc]);

    const prefersReduced = typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const navigateAndReset = () => {
      if (targetPath) {
        navigate(targetPath);
      }
      // Hold overlay opaque briefly after navigation to prevent background flash
      const hold = window.setTimeout(() => {
        setOverlayVisible(false);
        const end = window.setTimeout(() => {
          setIsTransitioning(false);
          setTargetPath('');
          setPhase('idle');
        }, OVERLAY_FADE_OUT_MS);
        timersRef.current.push(end);
      }, REVEAL_AFTER_NAV_MS);
      timersRef.current.push(hold);
    };

    // Soft transition branch
    if (variant === 'soft') {
      // Accessibility: reduced motion -> skip long fades
      if (prefersReduced) {
        setPhase('soft-logo');
        const toNav = window.setTimeout(() => {
          navigateAndReset();
        }, SOFT_LOGO_INTRO_MS);
        timersRef.current.push(toNav);
        return () => {
          timersRef.current.forEach(clearTimeout);
          timersRef.current = [];
        };
      }

      setPhase('soft-logo');
      // After logo hold, navigate and fade overlay out
      const toNav = window.setTimeout(() => {
        navigateAndReset();
      }, SOFT_LOGO_INTRO_MS);

      timersRef.current.push(toNav);
      return () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
      };
    }

    // Strobe + logo transition branch (default)
    const endStrobe = () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (!logoShownRef.current) {
        setPhase('logo');
        logoShownRef.current = true;
      }
      setStrobeOn(false);
    };

    const finishStrobe = () => {
      if (targetPath) {
        navigate(targetPath);
      }
      // Hold overlay opaque briefly after navigation to prevent background flash
      const hold = window.setTimeout(() => {
        setOverlayVisible(false);
        const end = window.setTimeout(() => {
          setIsTransitioning(false);
          setTargetPath('');
          setPhase('idle');
        }, OVERLAY_FADE_OUT_MS);
        timersRef.current.push(end);
      }, REVEAL_AFTER_NAV_MS);
      timersRef.current.push(hold);
    };

    // Accessibility: reduced motion skips the strobe
    if (prefersReduced) {
      if (!logoShownRef.current) {
        setPhase('logo');
        logoShownRef.current = true;
      }
      const end = window.setTimeout(finishStrobe, LOGO_DISPLAY_MS + 600);
      timersRef.current.push(end);
      return () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
      };
    }

    // Strobe phase (slower to stay under ~3 flashes/sec)
    setPhase('strobe');
    setStrobeOn(true);
    intervalRef.current = window.setInterval(() => {
      setStrobeOn(prev => !prev);
    }, STROBE_TOGGLE_MS) as unknown as number; // 3Hz max (toggle ~166ms; full cycle ~333ms)

    const toLogo = window.setTimeout(() => {
      endStrobe();
    }, STROBE_DURATION_MS); // single short strobe window

    const finish = window.setTimeout(finishStrobe, STROBE_DURATION_MS + LOGO_DISPLAY_MS + 600);

    timersRef.current.push(toLogo, finish);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      timersRef.current.forEach(clearTimeout);
      intervalRef.current = null;
      timersRef.current = [];
    };
  }, [isTransitioning, navigate, targetPath, variant, previewSrc]);

  // Intro on first visit to home (per tab/session)
  const location = useLocation();
  useEffect(() => {
    try {
      const played = sessionStorage.getItem('introPlayed') === '1';
      if (location.pathname === '/' && !played && !isTransitioning) {
        // Start intro without navigation
        setTargetPath('');
        setIsTransitioning(true);
        sessionStorage.setItem('introPlayed', '1');
      }
    } catch {}
  }, [location.pathname, isTransitioning]);

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      {children}
      <div
        className={`fixed inset-0 z-[99999] bg-void transition-opacity duration-[600ms] ${
          overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'center center', willChange: 'opacity, transform' }}
      >
        {/* Texture strobe layer */}
        <img
          src={TEXTURE_URL}
          alt="Croft texture"
          className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-50 ${
            phase === 'strobe' && strobeOn ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />

        {/* Centered logo + title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-6">
            <CroftLogo
              className={`w-[18rem] h-[18rem] md:w-[20rem] md:h-[20rem] lg:w-[22rem] lg:h-[22rem] transition-all duration-300 ${
                phase === 'soft-logo' || phase === 'logo' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } ${
                phase === 'soft-logo'
                  ? 'invert brightness-200 drop-shadow-[0_0_3rem_hsl(var(--foreground)/0.9)]'
                  : 'invert brightness-110'
              }`}
            />
            <div
              className={`font-brutalist text-2xl md:text-3xl lg:text-4xl tracking-wider text-primary-foreground transition-opacity duration-300 ${
                phase === 'soft-logo' || phase === 'logo' ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            >
              CROFT COMMON
            </div>
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
};