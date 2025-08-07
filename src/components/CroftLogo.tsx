import { cn } from "@/lib/utils";

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
      src="/lovable-uploads/4fef4ea3-1c24-49ce-b424-ae8af9468bed.png"
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