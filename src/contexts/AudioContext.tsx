import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  isGlobalMuted: boolean;
  toggleGlobalMute: () => void;
  isAudioPreloading: boolean;
  setAudioPreloading: (loading: boolean) => void;
  audioPreloadStarted: boolean;
  startAudioPreload: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [isAudioPreloading, setIsAudioPreloading] = useState(false);
  const [audioPreloadStarted, setAudioPreloadStarted] = useState(false);

  const toggleGlobalMute = () => {
    setIsGlobalMuted(prev => !prev);
  };

  const startAudioPreload = () => {
    if (!audioPreloadStarted) {
      setAudioPreloadStarted(true);
      setIsAudioPreloading(true);
      
      // Stop preloading after audio has had time to load
      setTimeout(() => {
        setIsAudioPreloading(false);
      }, 3000);
    }
  };

  return (
    <AudioContext.Provider value={{ 
      isGlobalMuted, 
      toggleGlobalMute,
      isAudioPreloading,
      setAudioPreloading: setIsAudioPreloading,
      audioPreloadStarted,
      startAudioPreload
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};