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

  const onTransitionComplete = () => {
    navigate(targetPath);
    setIsTransitioning(false);
    setTargetPath('');
  };

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      {children}
      <div 
        className={`fixed inset-0 z-[99999] bg-accent-pink transition-all duration-700 ease-in-out ${
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
      />
    </TransitionContext.Provider>
  );
};