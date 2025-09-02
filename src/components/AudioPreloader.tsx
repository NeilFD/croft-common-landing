import React, { useState, useEffect, useRef } from 'react';
import CroftCommonAudioPlayer from './slides/CroftCommonAudioPlayer';
import RestaurantAmbientAudio from './slides/RestaurantAmbientAudio';

const AudioPreloader: React.FC = () => {
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    const handleStartPreload = () => {
      setShouldPreload(true);
    };

    window.addEventListener('startAudioPreload', handleStartPreload);
    return () => window.removeEventListener('startAudioPreload', handleStartPreload);
  }, []);

  if (!shouldPreload) return null;

  return (
    <div className="hidden">
      <CroftCommonAudioPlayer 
        isPlaying={true}
        onToggle={() => {}}
      />
      <RestaurantAmbientAudio autoPlay={true} />
    </div>
  );
};

export default AudioPreloader;