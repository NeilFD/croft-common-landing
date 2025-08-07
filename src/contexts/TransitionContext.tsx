import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (path: string) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};

interface TransitionProviderProps {
  children: React.ReactNode;
}

export const TransitionProvider = ({ children }: TransitionProviderProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState('');
  const navigate = useNavigate();

  const triggerTransition = (path: string) => {
    setTargetPath(path);
    setIsTransitioning(true);
  };

  const getTransitionColor = () => {
    if (targetPath === '/cocktails') return 'bg-[hsl(var(--accent-lime))]';
    if (targetPath === '/beer') return 'bg-accent-orange';
    if (targetPath === '/kitchens') return 'bg-accent-blood-red';
    if (targetPath === '/hall') return 'bg-accent-vivid-purple';
    if (targetPath === '/community') return 'bg-[hsl(var(--accent-electric-blue))]';
    if (targetPath === '/common-room') return 'bg-green-600';
    return 'bg-accent-pink';
  };

  const onTransitionComplete = () => {
    navigate(targetPath);
    setIsTransitioning(false);
    setTargetPath('');
  };

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      {children}
      <div 
        className={`fixed inset-0 z-[99999] ${getTransitionColor()} transition-all duration-700 ease-in-out ${
          isTransitioning 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-150 pointer-events-none'
        }`}
        style={{
          transformOrigin: 'center center',
        }}
        onTransitionEnd={() => {
          if (isTransitioning) {
            setTimeout(onTransitionComplete, 200);
          }
        }}
      >
        {/* Watermark during transition */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/lovable-uploads/4fef4ea3-1c24-49ce-b424-ae8af9468bed.png" 
            alt="Croft Common" 
            className={`w-[50rem] h-[50rem] object-contain transition-all duration-700 ${
              isTransitioning 
                ? 'opacity-100 scale-110' 
                : 'opacity-0 scale-90'
            }`}
            style={{ 
              filter: 'brightness(0) invert(1) contrast(200) drop-shadow(0 0 20px rgba(255,255,255,0.8))'
            }}
          />
        </div>
      </div>
    </TransitionContext.Provider>
  );
};