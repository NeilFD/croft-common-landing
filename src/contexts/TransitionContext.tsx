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

  const getTransitionStyle = () => {
    let colorTint = 'rgba(255, 255, 255, 0.08)';
    let slideDirection = 'translateX(100%)';
    
    if (targetPath === '/cocktails') {
      colorTint = 'rgba(163, 230, 53, 0.12)'; // lime tint
      slideDirection = 'translateX(-100%)'; // slide from left
    }
    if (targetPath === '/beer') {
      colorTint = 'rgba(249, 115, 22, 0.12)'; // orange tint  
      slideDirection = 'translateY(-100%)'; // slide from top
    }
    if (targetPath === '/kitchens') {
      colorTint = 'rgba(220, 38, 127, 0.12)'; // blood red tint
      slideDirection = 'translateX(100%)'; // slide from right
    }
    if (targetPath === '/hall') {
      colorTint = 'rgba(147, 51, 234, 0.12)'; // purple tint
      slideDirection = 'translateY(100%)'; // slide from bottom
    }
    if (targetPath === '/community') {
      colorTint = 'rgba(59, 130, 246, 0.12)'; // blue tint
      slideDirection = 'translateX(-100%)'; // slide from left
    }
    if (targetPath === '/common-room') {
      colorTint = 'rgba(34, 197, 94, 0.12)'; // green tint
      slideDirection = 'translateY(-100%)'; // slide from top
    }
    
    return {
      backgroundImage: `
        linear-gradient(${colorTint}, ${colorTint}),
        url('/lovable-uploads/249fc249-8fca-4547-b0ad-b0d1b96be72e.png')
      `,
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat, repeat',
      '--slide-direction': slideDirection
    };
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
        className={`fixed inset-0 z-[99999] transition-all duration-1000 ease-in-out ${
          isTransitioning 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-110 pointer-events-none'
        }`}
        style={{
          transformOrigin: 'center center',
          ...getTransitionStyle(),
        }}
        onTransitionEnd={() => {
          if (isTransitioning) {
            setTimeout(onTransitionComplete, 300);
          }
        }}
      >
        {/* Enhanced logo during transition */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <img 
              src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
              alt="Croft Common"
              className={`w-[50rem] h-[50rem] object-contain transition-all duration-1000 ease-out ${
                isTransitioning 
                  ? 'opacity-90 scale-105' 
                  : 'opacity-0 scale-95'
              }`}
              style={{ 
                filter: 'brightness(0) invert(1) contrast(150) drop-shadow(0 4px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(255,255,255,0.6))',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            />
            {/* Embossed effect overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 transition-opacity duration-1000 ${
                isTransitioning ? 'opacity-60' : 'opacity-0'
              }`}
              style={{
                maskImage: 'url(/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png)',
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat'
              }}
            />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
};