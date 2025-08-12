import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/data/brand";
import fallbackLogo from "@/assets/croft-logo.png";

interface CroftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CroftLogo = ({ className, size = 'md' }: CroftLogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <img 
      src={BRAND_LOGO}
      alt="Croft Common Logo"
      className={cn(
        "object-contain",
        sizeClasses[size],
        className
      )}
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (img.dataset.fallbacked === '1') return;
        img.dataset.fallbacked = '1';
        img.src = fallbackLogo;
      }}
    />
  );
};

export default CroftLogo;