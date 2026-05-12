import { useEffect, useState } from 'react';
import MenuButton from './MenuButton';
import { homeMenu } from '@/data/menuData';
import BookFloatingButton from './BookFloatingButton';
import CroftLogo from './CroftLogo';

const POSTER = '/video/crazy-bear-hero-poster.jpg';
const SRC_WEBM = '/video/crazy-bear-hero.webm';
const SRC_MP4 = '/video/crazy-bear-hero.mp4';
const SRC_MP4_MOBILE = '/video/crazy-bear-hero-720.mp4';

const HeroVideo = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {reduceMotion ? (
        <img
          src={POSTER}
          alt="Crazy Bear hero"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          aria-hidden="true"
        >
          <source src={SRC_WEBM} type="video/webm" />
          <source src={SRC_MP4_MOBILE} type="video/mp4" media="(max-width: 768px)" />
          <source src={SRC_MP4} type="video/mp4" />
        </video>
      )}

      {/* Subtle overlay for legibility */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center mt-16 z-10 pointer-events-none"
        aria-hidden
        data-watermark="true"
      >
        <CroftLogo
          className="w-[27.5rem] h-[27.5rem] sm:w-[30rem] sm:h-[30rem] md:w-[32.5rem] md:h-[32.5rem] lg:w-[35rem] lg:h-[35rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 invert pointer-events-none"
          priority={true}
          enableDevPanel={false}
          interactive={false}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-[hsl(var(--accent-pink))]"></div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[hsl(var(--accent-pink))] mt-1"></div>
        </div>
      </div>

      <BookFloatingButton />
      <MenuButton pageType="cafe" menuData={homeMenu} forceCafeAccent />
    </div>
  );
};

export default HeroVideo;
