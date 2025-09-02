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
    console.log('🎵 Enter button clicked, isReady:', isReady);
    if (!isReady) return;
    
    console.log('🎵 Setting audioStarted to true');
    setAudioStarted(true);
    
    setTimeout(() => {
      console.log('🎵 Calling onEnter after delay');
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
      <div className="text-center mb-12 max-w-4xl px-6">
        <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4">
          Stokes Croft's new centre of gravity. A landmark launch, and a rare chance for Bristol's best operators to step inside and deliver hospitality at its finest.
        </p>
        <p className="text-base md:text-lg text-white/80 leading-relaxed mb-4">
          Rooted in the neighbourhood, alive with the city's energy, Croft Common is where Bristol meets, eats, and stays a little longer than planned. We've reimagined a landmark building as a place to gather, make, eat, drink, and celebrate, from first coffee to last call.
        </p>
        <p className="text-base md:text-lg text-white/80 leading-relaxed mb-4">
          The Kitchens bring together outstanding independent food talent. The Café shifts from morning espresso to late-night vinyl. The Cocktail Bar, Beer Hall, Courtyard, Hall and Rooftop all add their own rhythm. Every detail has been designed to create experiences that feel effortless, social, and unforgettable.
        </p>
        <p className="text-base md:text-lg text-white/80 leading-relaxed">
          This is Croft Common - a space shaped by Stokes Croft, for Bristol, with you at the centre.
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