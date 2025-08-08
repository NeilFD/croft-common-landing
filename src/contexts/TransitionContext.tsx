import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CroftLogo from '@/components/CroftLogo';
import { preloadImages } from '@/hooks/useImagePreloader';


interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (path: string) => void;
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
  const navigate = useNavigate();

  const triggerTransition = (path: string) => {
    setTargetPath(path);
    setIsTransitioning(true);
  };

  // Strobe + logo transition implementation
  const [phase, setPhase] = useState<'idle' | 'strobe' | 'logo'>('idle');
  const [strobeOn, setStrobeOn] = useState(false);
  const timersRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const logoShownRef = useRef(false);

  const TEXTURE_URL = '/lovable-uploads/d1fb9178-8f7e-47fb-a8ac-71350264d76f.png';

  useEffect(() => {
    if (!isTransitioning) return;

    // Reset single-logo guard for this transition
    logoShownRef.current = false;

    // Preload assets for a seamless effect
    preloadImages([TEXTURE_URL, '/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png']);

    const prefersReduced = typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const navigateAndReset = () => {
      navigate(targetPath);
      const hide = window.setTimeout(() => {
        setIsTransitioning(false);
        setTargetPath('');
        setPhase('idle');
      }, 150);
      timersRef.current.push(hide);
    };

    // Accessibility: reduced motion skips the strobe
    if (prefersReduced) {
      if (!logoShownRef.current) {
        setPhase('logo');
        logoShownRef.current = true;
      }
      const end = window.setTimeout(navigateAndReset, 250);
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
    }, 182) as unknown as number; // ~2.75Hz (toggle ~182ms; full cycle ~364ms)

    const toLogo = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (!logoShownRef.current) {
        setPhase('logo');
        logoShownRef.current = true;
      }
      setStrobeOn(false);
    }, 900); // extend strobe window slightly

    const finish = window.setTimeout(navigateAndReset, 900 + 300);

    timersRef.current.push(toLogo, finish);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      timersRef.current.forEach(clearTimeout);
      intervalRef.current = null;
      timersRef.current = [];
    };
  }, [isTransitioning, navigate, targetPath]);

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      {children}
      <div
        className={`fixed inset-0 z-[99999] bg-void transition-opacity duration-100 ${
          isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'center center' }}
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

        {/* Centered logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <CroftLogo
            className={`w-[30rem] h-[30rem] md:w-[25rem] md:h-[25rem] lg:w-[20rem] lg:h-[20rem] transition-all duration-200 ${
              phase === 'logo' ? 'opacity-100 scale-100 invert brightness-110' : 'opacity-0 scale-95'
            }`}
          />
        </div>
      </div>
    </TransitionContext.Provider>
  );
};