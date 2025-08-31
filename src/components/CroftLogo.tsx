import { useState } from 'react';
import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/data/brand";
import fallbackLogo from "@/assets/croft-logo.png";

interface CroftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

const CroftLogo = ({ className, size = 'md', priority = false }: CroftLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("object-contain", sizeClasses[size], className)}>
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