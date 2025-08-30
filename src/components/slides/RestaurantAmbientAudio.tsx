import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface RestaurantAmbientAudioProps {
  isPlaying: boolean;
}

const RestaurantAmbientAudio: React.FC<RestaurantAmbientAudioProps> = ({ 
  isPlaying 
}) => {
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  
  // Restaurant ambience Spotify track
  const trackId = "1S19QdPqpeQ3SMIGNaQiRA";
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1&loop=1`;

  const toggleAmbient = () => {
    setIsAmbientPlaying(!isAmbientPlaying);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {isPlaying && isAmbientPlaying && (
        <div className="w-80 h-20 bg-black rounded-lg overflow-hidden border border-white/20">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        </div>
      )}
      
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