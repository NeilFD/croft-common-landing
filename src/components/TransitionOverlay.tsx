import { useEffect, useState } from 'react';

interface TransitionOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

const TransitionOverlay = ({ isActive, onComplete }: TransitionOverlayProps) => {
  const [stage, setStage] = useState<'hidden' | 'expanding' | 'complete'>('hidden');

  useEffect(() => {
    if (isActive) {
      setStage('expanding');
      const timer = setTimeout(() => {
        setStage('complete');
        setTimeout(onComplete, 200);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setStage('hidden');
    }
  }, [isActive, onComplete]);

  if (stage === 'hidden') return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-accent-pink transition-all duration-600 ease-out ${
        stage === 'expanding' 
          ? 'scale-150 opacity-100' 
          : 'scale-100 opacity-0'
      }`}
      style={{
        transformOrigin: 'center center',
      }}
    />
  );
};

export default TransitionOverlay;