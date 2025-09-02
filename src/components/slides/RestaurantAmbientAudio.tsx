import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

const RestaurantAmbientAudio: React.FC = () => {
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isGlobalMuted } = useAudio();
  
  // Archive.org hosted pub ambient audio
  const audioUrl = "https://archive.org/download/es-london-pub-crowded-no-music-epidemic-sound/ES_London%2C%20Pub%2C%20Crowded%2C%20No%20Music%20-%20Epidemic%20Sound.mp3";

  const toggleAmbient = () => {
    setIsAmbientPlaying(!isAmbientPlaying);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      // Simple control: play when ambient is playing and not globally muted
      if (isAmbientPlaying && !isGlobalMuted) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAmbientPlaying, isGlobalMuted, volume]);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-black/20 rounded-lg border border-white/20">
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="auto"
        className="hidden"
      />
      
      <div className="text-center space-y-2">
        <h3 className="text-white text-lg font-medium">Hospitality Buzz</h3>
        <p className="text-white/70 text-sm">Add some atmosphere</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          onClick={toggleAmbient}
          variant="outline"
          size="sm"
          className="bg-transparent border-white/50 text-white hover:bg-white/10"
          disabled={isGlobalMuted}
        >
          {isAmbientPlaying && !isGlobalMuted ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center space-x-2 min-w-32">
          <VolumeX className="h-4 w-4 text-white/60" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            className="flex-1"
            disabled={isGlobalMuted}
          />
          <Volume2 className="h-4 w-4 text-white/60" />
        </div>
      </div>
      
      {isGlobalMuted && (
        <p className="text-white/50 text-xs">Audio muted globally</p>
      )}
    </div>
  );
};

export default RestaurantAmbientAudio;