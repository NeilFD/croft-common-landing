import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface SpotifyPlayerProps {
  playlistId: string;
  isPlaying: boolean;
  onToggle: (playing: boolean) => void;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ 
  playlistId, 
  isPlaying, 
  onToggle 
}) => {
  const [showIframe, setShowIframe] = useState(false);
  const { isGlobalMuted } = useAudio();
  const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&autoplay=1&theme=0`;

  const handleToggle = () => {
    if (!isGlobalMuted) {
      if (!showIframe) {
        // Show iframe but don't auto-set playing state
        setShowIframe(true);
        // Don't call onToggle(true) here - let user click play when ready
      } else {
        onToggle(!isPlaying);
      }
    }
  };

  const handlePlaylistClick = () => {
    if (!showIframe) {
      setShowIframe(true);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {showIframe && !isGlobalMuted && (
        <div className="w-full flex justify-center mb-4">
          <iframe 
            data-testid="embed-iframe" 
            style={{borderRadius:'12px'}} 
            src="https://open.spotify.com/embed/playlist/0IrHtvIi9DVrTcFb1bM3CR?utm_source=generator" 
            width="100%" 
            height="352" 
            frameBorder="0" 
            allowFullScreen 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
          />
        </div>
      )}
      
      <div className="flex items-center justify-center">
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          className="bg-transparent border-white/50 text-white hover:bg-white/10"
          disabled={isGlobalMuted}
        >
          {isPlaying && !isGlobalMuted ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isGlobalMuted && (
        <p className="text-white/50 text-xs text-center">Audio muted globally</p>
      )}
    </div>
  );
};

export default SpotifyPlayer;