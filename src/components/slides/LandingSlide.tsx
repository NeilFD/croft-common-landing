import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import CroftCommonAudioPlayer from './CroftCommonAudioPlayer';
import RestaurantAmbientAudio from './RestaurantAmbientAudio';

interface LandingSlideProps {
  onEnter: () => void;
}

export const LandingSlide: React.FC<LandingSlideProps> = ({ onEnter }) => {
  const [audioStarted, setAudioStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(7);

  // Initialize countdown and readiness on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsReady(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEnterCommon = () => {
    if (!isReady) return;
    
    // Start both audio components in background and advance to next slide
    setAudioStarted(true);
    // Small delay to ensure audio components mount and start
    setTimeout(() => {
      onEnter();
    }, 100);
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Header with Logo and Title */}
      <div className="flex flex-col items-center space-y-6 mb-12">
        <CroftLogo size="lg" className="w-16 h-16" priority />
        <h1 className="text-4xl md:text-6xl font-brutalist tracking-wider text-center">
          Welcome to Croft Common
        </h1>
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-12 max-w-3xl px-6">
        <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4">
          An exciting new launch in Bristol's Stokes Croft, an opportunity for some of Bristol's best operators to join us and deliver exceptional Hospitality in a completely unique setting.
        </p>
        <p className="text-base md:text-lg text-white/80 leading-relaxed">
          Step into a world where culinary artistry meets intimate atmosphere. Our carefully curated space brings together innovative dining concepts, expertly crafted cocktails, and an ambience that celebrates the vibrant spirit of one of Bristol's most creative neighborhoods. Every element has been thoughtfully designed to create an unforgettable experience.
        </p>
      </div>

      {/* Enter Button */}
      <div className="flex flex-col items-center mb-12">
        {!isReady && (
          <p className="text-white/70 mb-4 text-sm">
            Setting the scene...
          </p>
        )}
        <Button
          onClick={handleEnterCommon}
          variant="outline"
          size="lg"
          disabled={!isReady}
          className={`bg-transparent border-white text-white transition-all duration-300 px-8 py-4 text-lg ${
            isReady 
              ? 'hover:bg-white hover:text-black opacity-100 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          Enter Croft Common
        </Button>
      </div>

      {/* Hidden Audio Components - Auto-start when audioStarted is true */}
      {audioStarted && (
        <div className="hidden">
          <CroftCommonAudioPlayer 
            isPlaying={true}
            onToggle={() => {}}
          />
          <RestaurantAmbientAudio autoPlay={true} />
        </div>
      )}

      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </section>
  );
};