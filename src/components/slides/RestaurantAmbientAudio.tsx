import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface RestaurantAmbientAudioProps {
  isPlaying: boolean;
}

const RestaurantAmbientAudio: React.FC<RestaurantAmbientAudioProps> = ({ 
  isPlaying 
}) => {
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Archive.org hosted pub ambient audio
  const audioUrl = "https://archive.org/download/es-london-pub-crowded-no-music-epidemic-sound/ES_London%2C%20Pub%2C%20Crowded%2C%20No%20Music%20-%20Epidemic%20Sound.mp3";

  const toggleAmbient = () => {
    const newState = !isAmbientPlaying;
    setIsAmbientPlaying(newState);
    
    if (audioRef.current) {
      if (newState && isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isAmbientPlaying && isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isAmbientPlaying]);

  return (
    <div className="flex flex-col items-center space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="auto"
        className="hidden"
      />
      
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
    </div>
  );
};

export default RestaurantAmbientAudio;