import { useState } from 'react';
import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/data/brand";
import fallbackLogo from "@/assets/croft-logo.png";
import { useHiddenDevPanel } from '@/hooks/useHiddenDevPanel';

interface CroftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
  onClick?: () => void;
  enableDevPanel?: boolean;
}

const CroftLogo = ({ className, size = 'md', priority = false, onClick, enableDevPanel = true }: CroftLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const { handleLogoTap } = useHiddenDevPanel();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const handleClick = () => {
    if (enableDevPanel) {
      handleLogoTap();
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={cn("object-contain cursor-pointer", sizeClasses[size], className)}
      onClick={handleClick}
    >
      {!imageError ? (
        <img
          src={BRAND_LOGO}
          alt="Croft Common Logo"
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <img
          src={fallbackLogo}
          alt="Croft Common Logo"
          className="w-full h-full object-contain"
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
};

export default CroftLogo;