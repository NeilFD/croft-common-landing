import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface CroftCommonAudioPlayerProps {
  isPlaying: boolean;
  onToggle: (playing: boolean) => void;
  onLoad?: () => void;
}

const CroftCommonAudioPlayer: React.FC<CroftCommonAudioPlayerProps> = ({ 
  isPlaying, 
  onToggle,
  onLoad
}) => {
  const [volume, setVolume] = useState(0.6);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isGlobalMuted } = useAudio();
  
  // Archive.org hosted Croft Common audio
  const audioUrl = "https://archive.org/download/untitled-2-01092025-15.34/Untitled%202%20-%2001092025%2C%2015.34.m4a";

  const handleToggle = () => {
    if (!isGlobalMuted) {
      onToggle(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      onLoad?.();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('loadstart', handleLoadStart);

    // Start loading the audio immediately
    audio.load();

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [onLoad]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      if (isPlaying && !isGlobalMuted) {
        setIsLoading(true);
        audioRef.current.play()
          .then(() => setIsLoading(false))
          .catch((error) => {
            console.error('Audio playback failed:', error);
            setIsLoading(false);
            onToggle(false);
          });
      } else {
        audioRef.current.pause();
        setIsLoading(false);
      }
    }
  }, [isPlaying, isGlobalMuted, volume, onToggle]);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-black/20 rounded-lg border border-white/20">
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="auto"
        className="hidden"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
      />
      
      <div className="text-center space-y-2">
        <h3 className="text-white text-lg font-medium">Croft Common Playlist</h3>
        <p className="text-white/70 text-sm">Croft Common Sounds</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          className="bg-transparent border-white/50 text-white hover:bg-white/10"
          disabled={isGlobalMuted || isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPlaying && !isGlobalMuted ? (
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

export default CroftCommonAudioPlayer;