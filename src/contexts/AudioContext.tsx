import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  isGlobalMuted: boolean;
  toggleGlobalMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);

  const toggleGlobalMute = () => {
    setIsGlobalMuted(prev => !prev);
  };

  return (
    <AudioContext.Provider value={{ isGlobalMuted, toggleGlobalMute }}>
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