import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { cn } from '@/lib/utils';

const MasterAudioControl: React.FC = () => {
  const { isGlobalMuted, toggleGlobalMute } = useAudio();

  return (
    <Button 
      onClick={toggleGlobalMute}
      variant="outline" 
      size="sm" 
      className={cn(
        "bg-background/95 backdrop-blur-sm border-2 border-foreground/20",
        "hover:bg-[hsl(var(--accent-pink))] hover:border-[hsl(var(--accent-pink))]",
        "hover:text-background transition-all duration-300",
        "font-brutalist tracking-wider text-xs"
      )}
    >
      {isGlobalMuted ? (
        <VolumeX className="h-4 w-4 mr-2" />
      ) : (
        <Volume2 className="h-4 w-4 mr-2" />
      )}
      {isGlobalMuted ? 'Unmute' : 'Mute'}
    </Button>
  );
};

export default MasterAudioControl;