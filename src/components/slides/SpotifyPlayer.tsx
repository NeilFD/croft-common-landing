import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, ExternalLink } from 'lucide-react';
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
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;

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

  const openSpotify = () => {
    window.open(spotifyUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {showIframe && !isGlobalMuted && (
        <div className="w-full h-88 bg-black rounded-xl overflow-hidden border border-white/20">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-3">
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
        
        <Button
          onClick={openSpotify}
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in Spotify
        </Button>
      </div>
      
      {isGlobalMuted && (
        <p className="text-white/50 text-xs text-center">Audio muted globally</p>
      )}
    </div>
  );
};

export default SpotifyPlayer;