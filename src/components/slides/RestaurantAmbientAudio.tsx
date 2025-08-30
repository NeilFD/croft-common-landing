import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface RestaurantAmbientAudioProps {
  isPlaying: boolean;
}

const RestaurantAmbientAudio: React.FC<RestaurantAmbientAudioProps> = ({ 
  isPlaying 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);

  // Restaurant ambience sound effect (using a free sound URL)
  const ambientSoundUrl = "https://www.soundjay.com/misc/sounds/restaurant_ambience.mp3";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      if (isPlaying && isAmbientPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isAmbientPlaying, volume]);

  const toggleAmbient = () => {
    setIsAmbientPlaying(!isAmbientPlaying);
  };

  return (
    <div className="flex items-center space-x-2">
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
      >
        <source src={ambientSoundUrl} type="audio/mpeg" />
        {/* Fallback: Using a data URL for a simple ambient sound */}
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IAAAAAEAAQBEAAAAEAAAAAgABAAUAAAAAA==" type="audio/wav" />
      </audio>
      
      <Button
        onClick={toggleAmbient}
        variant="ghost"
        size="sm"
        className="text-white/60 hover:text-white/80 hover:bg-white/5 text-xs"
      >
        {isAmbientPlaying ? (
          <Volume2 className="mr-1 h-3 w-3" />
        ) : (
          <VolumeX className="mr-1 h-3 w-3" />
        )}
        Restaurant Ambience
      </Button>
      
      {isAmbientPlaying && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      )}
    </div>
  );
};

export default RestaurantAmbientAudio;