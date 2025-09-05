import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/data/brand";

interface CroftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

const CroftLogo = ({ className, size = 'md', priority = false }: CroftLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Reset error state when BRAND_LOGO changes
  useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [BRAND_LOGO]);

  const handleImageError = () => {
    console.error('❌ [CroftLogo] Failed to load brand logo:', BRAND_LOGO);
    
    if (retryCount < 2) {
      // Retry loading the primary logo
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    } else {
      // After retries failed, show text fallback only
      setImageError(true);
    }
  };

  const logoSrc = retryCount > 0 ? `${BRAND_LOGO}?retry=${retryCount}&t=${Date.now()}` : BRAND_LOGO;

  return (
    <div className={cn("object-contain", sizeClasses[size], className)}>
      {!imageError ? (
        <img
          src={logoSrc}
          alt="Croft Common Logo"
          className="w-full h-full object-contain"
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <div className={cn("w-full h-full flex items-center justify-center", sizeClasses[size])}>
          <span className="font-brutalist text-foreground text-sm font-bold">CC</span>
        </div>
      )}
    </div>
  );
};

export default CroftLogo;