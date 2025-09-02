import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioPreloaderContextType {
  isAudioReady: boolean;
  isLoading: boolean;
  startAudioPlayback: () => void;
  audioError: string | null;
  preloadAudio: () => Promise<void>;
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

  // Simple, fast audio preload
  const preloadAudio = async () => {
    if (isLoading || isAudioReady) return;
    
    setIsLoading(true);
    setAudioError(null);
    console.log('🎵 Starting fast audio preload...');

    try {
      const croftAudio = new Audio('/lovable-uploads/56ad9830-6a9c-46c6-b84b-7e2f6d4ea91e.mp3');
      const ambientAudio = new Audio('/lovable-uploads/6c8b8ddc-53cd-4e38-8de7-0b0dae3dc86f.mp3');

      croftAudio.preload = 'auto';
      ambientAudio.preload = 'auto';
      croftAudio.loop = true;
      ambientAudio.loop = true;
      croftAudio.volume = 0.7;
      ambientAudio.volume = 0.3;

      // Simple timeout-based ready check - don't wait for perfect loading
      let readyCount = 0;
      const checkReady = () => {
        readyCount++;
        if (readyCount >= 2 || croftAudio.readyState >= 3 || ambientAudio.readyState >= 3) {
          console.log('🎵 Audio ready!');
          setAudioRefs({ croft: croftAudio, ambient: ambientAudio });
          setIsAudioReady(true);
          setIsLoading(false);
        }
      };

      croftAudio.addEventListener('loadeddata', checkReady, { once: true });
      ambientAudio.addEventListener('loadeddata', checkReady, { once: true });
      
      // Force ready after 2 seconds max
      setTimeout(() => {
        if (!isAudioReady) {
          console.log('🎵 Force ready after timeout');
          setAudioRefs({ croft: croftAudio, ambient: ambientAudio });
          setIsAudioReady(true);
          setIsLoading(false);
        }
      }, 2000);

      croftAudio.load();
      ambientAudio.load();
      
    } catch (error) {
      console.error('Audio preload failed:', error);
      setAudioError('Failed to load audio');
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
      audioError,
      preloadAudio
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

// Hook to start preloading when authorized - IMMEDIATE START
export const useStartAudioPreload = (isAuthorized: boolean) => {
  const audioPreloader = useAudioPreloader();

  useEffect(() => {
    if (isAuthorized) {
      console.log('🎵 IMMEDIATE audio preload start');
      audioPreloader.preloadAudio();
    }
  }, [isAuthorized, audioPreloader]);
};