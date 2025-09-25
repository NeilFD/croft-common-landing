import { useState } from 'react';
import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/data/brand";
import { useHiddenDevPanel } from '@/hooks/useHiddenDevPanel';
import { useLongPress } from '@/hooks/useLongPress';

interface CroftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
  onClick?: () => void;
  enableDevPanel?: boolean;
  interactive?: boolean;
}

const CroftLogo = ({ className, size = 'md', priority = false, onClick, enableDevPanel = true, interactive = false }: CroftLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const { handleLogoTap, openPanel } = useHiddenDevPanel();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Long-press handler (1.2s) for watermark accessibility
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (enableDevPanel) {
        openPanel();
      }
    },
    onClick: () => {
      if (enableDevPanel) {
        handleLogoTap();
      }
      if (onClick) {
        onClick();
      }
    },
    delay: 1200
  });

  return (
    <div 
      className={cn(
        "object-contain select-none",
        interactive ? "cursor-pointer pointer-events-auto" : "cursor-default pointer-events-none",
        "z-20",
        sizeClasses[size], 
        className
      )}
      {...(interactive ? (enableDevPanel ? longPressHandlers : (onClick ? { onClick } : {})) : {})}
      aria-hidden={!interactive}
      role={interactive ? undefined : "presentation"}
    >
      {!imageError ? (
        <img
          src={BRAND_LOGO}
          alt="Croft Common Logo"
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
          loading={priority ? 'eager' : 'lazy'}
          draggable={false}
        />
      ) : (
        <img
          src="/brand/logo.png"
          alt="Croft Common Logo"
          className="w-full h-full object-contain"
          loading={priority ? 'eager' : 'lazy'}
          draggable={false}
        />
      )}
    </div>
  );
};

export default CroftLogo;