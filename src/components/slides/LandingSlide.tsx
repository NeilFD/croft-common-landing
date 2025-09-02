import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import { useAudioPreloader } from '@/contexts/AudioPreloaderContext';

interface LandingSlideProps {
  onEnter: () => void;
}

export const LandingSlide: React.FC<LandingSlideProps> = ({ onEnter }) => {
  const { isAudioReady, isLoading, startAudioPlayback, audioError } = useAudioPreloader();

  const handleEnterCommon = async () => {
    if (!isAudioReady) return;
    
    // Start audio playback and advance to next slide
    await startAudioPlayback();
    onEnter();
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
      <div className="text-center mb-12 max-w-2xl px-6">
        <p className="text-lg md:text-xl text-white/90 leading-relaxed">
          An exciting new launch in Bristol's Stokes Croft, an opportunity for some of Bristol's best operators to join us and deliver exceptional Hospitality in a completely unique setting.
        </p>
      </div>

      {/* Enter Button */}
      <div className="flex justify-center mb-12">
        <Button
          onClick={handleEnterCommon}
          variant="outline"
          size="lg"
          disabled={!isAudioReady}
          className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-colors duration-300 px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isAudioReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting the scene...
            </>
          ) : (
            'Enter Croft Common'
          )}
        </Button>
      </div>

      {/* Error message if audio fails to load */}
      {audioError && (
        <div className="text-red-400 text-sm mt-4">
          {audioError}
        </div>
      )}

      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </section>
  );
};