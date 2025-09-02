import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioPreloaderContextType {
  isAudioReady: boolean;
  isLoading: boolean;
  startAudioPlayback: () => void;
  audioError: string | null;
}

const AudioPreloaderContext = createContext<AudioPreloaderContextType | undefined>(undefined);

export const AudioPreloaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{
    croft: HTMLAudioElement | null;
    ambient: HTMLAudioElement | null;
  }>({ croft: null, ambient: null });
  const [isPlaying, setIsPlaying] = useState(false);

  // Preload audio files
  const preloadAudio = async () => {
    setIsLoading(true);
    setAudioError(null);

    try {
      // Create audio elements
      const croftAudio = new Audio('/lovable-uploads/56ad9830-6a9c-46c6-b84b-7e2f6d4ea91e.mp3');
      const ambientAudio = new Audio('/lovable-uploads/6c8b8ddc-53cd-4e38-8de7-0b0dae3dc86f.mp3');

      croftAudio.preload = 'auto';
      ambientAudio.preload = 'auto';
      croftAudio.loop = true;
      ambientAudio.loop = true;
      croftAudio.volume = 0.7;
      ambientAudio.volume = 0.3;

      // Wait for both to be ready
      const loadPromises = [
        new Promise<void>((resolve, reject) => {
          croftAudio.addEventListener('canplaythrough', () => resolve(), { once: true });
          croftAudio.addEventListener('error', reject, { once: true });
        }),
        new Promise<void>((resolve, reject) => {
          ambientAudio.addEventListener('canplaythrough', () => resolve(), { once: true });
          ambientAudio.addEventListener('error', reject, { once: true });
        })
      ];

      await Promise.all(loadPromises);

      setAudioRefs({ croft: croftAudio, ambient: ambientAudio });
      setIsAudioReady(true);
    } catch (error) {
      console.error('Audio preload failed:', error);
      setAudioError('Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  const startAudioPlayback = async () => {
    if (!isAudioReady || !audioRefs.croft || !audioRefs.ambient || isPlaying) return;

    try {
      setIsPlaying(true);
      await Promise.all([
        audioRefs.croft.play(),
        audioRefs.ambient.play()
      ]);
    } catch (error) {
      console.error('Failed to start audio playback:', error);
      setAudioError('Failed to start audio playback');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRefs.croft) {
        audioRefs.croft.pause();
        audioRefs.croft.remove();
      }
      if (audioRefs.ambient) {
        audioRefs.ambient.pause();
        audioRefs.ambient.remove();
      }
    };
  }, [audioRefs]);

  return (
    <AudioPreloaderContext.Provider value={{
      isAudioReady,
      isLoading,
      startAudioPlayback,
      audioError
    }}>
      {children}
    </AudioPreloaderContext.Provider>
  );
};

export const useAudioPreloader = () => {
  const context = useContext(AudioPreloaderContext);
  if (context === undefined) {
    throw new Error('useAudioPreloader must be used within an AudioPreloaderProvider');
  }
  return context;
};

// Hook to start preloading when authorized
export const useStartAudioPreload = (isAuthorized: boolean) => {
  const [hasStarted, setHasStarted] = useState(false);
  const audioPreloader = useAudioPreloader();

  useEffect(() => {
    if (isAuthorized && !hasStarted && !audioPreloader.isAudioReady && !audioPreloader.isLoading) {
      setHasStarted(true);
      // Start preloading immediately when authorized
      const preloadAudio = async () => {
        try {
          const croftAudio = new Audio('/lovable-uploads/56ad9830-6a9c-46c6-b84b-7e2f6d4ea91e.mp3');
          const ambientAudio = new Audio('/lovable-uploads/6c8b8ddc-53cd-4e38-8de7-0b0dae3dc86f.mp3');
          
          croftAudio.preload = 'auto';
          ambientAudio.preload = 'auto';
          croftAudio.loop = true;
          ambientAudio.loop = true;
          croftAudio.volume = 0.7;
          ambientAudio.volume = 0.3;
          
          // Start loading
          croftAudio.load();
          ambientAudio.load();
        } catch (error) {
          console.error('Failed to start audio preload:', error);
        }
      };
      
      preloadAudio();
    }
  }, [isAuthorized, hasStarted, audioPreloader]);
};