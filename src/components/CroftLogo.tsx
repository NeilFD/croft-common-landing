import { cn } from "@/lib/utils";
import geometricLogo from "@/assets/geometric-croft-logo.png";

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
      src={geometricLogo}
      alt="Croft Common Logo"
      className={cn(
        "object-contain",
        sizeClasses[size],
        className
      )}
    />
  );
};

export default CroftLogo;