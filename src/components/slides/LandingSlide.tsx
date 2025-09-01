import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import CroftCommonAudioPlayer from './CroftCommonAudioPlayer';
import RestaurantAmbientAudio from './RestaurantAmbientAudio';

interface LandingSlideProps {
  onEnter: () => void;
}

export const LandingSlide: React.FC<LandingSlideProps> = ({ onEnter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const [restaurantAmbienceEnabled, setRestaurantAmbienceEnabled] = useState(false);

  const handlePlayMusic = () => {
    setShowSpotify(true);
    setIsPlaying(false);
    // Auto-enable restaurant ambience for full experience
    setRestaurantAmbienceEnabled(true);
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Header with Logo and Title */}
      <div className="flex flex-col items-center space-y-4 mb-8">
        <CroftLogo size="lg" className="w-16 h-16" priority />
        <h1 className="text-4xl md:text-6xl font-brutalist tracking-wider">
          CROFT COMMON
        </h1>
      </div>

      {/* Instructions */}
      <div className="text-center mb-8 max-w-md">
        <p className="text-lg md:text-xl text-white/80 leading-relaxed">
          Before you start, set the scene, turn the sounds on
        </p>
      </div>

      {/* Music Controls */}
      <div className="flex flex-col items-center space-y-6 mb-12">
        {!showSpotify ? (
          <Button
            onClick={handlePlayMusic}
            variant="outline"
            size="lg"
            className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-colors duration-300"
          >
            <Play className="mr-2 h-5 w-5" />
            Set the Scene
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
              <div className="flex-1 w-full max-w-2xl">
                <CroftCommonAudioPlayer 
                  isPlaying={isPlaying}
                  onToggle={setIsPlaying}
                />
              </div>
              <div className="flex-1 w-full max-w-md">
                <RestaurantAmbientAudio />
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </section>
  );
};