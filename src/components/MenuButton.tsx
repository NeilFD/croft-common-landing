import { useState } from 'react';
import CroftLogo from './CroftLogo';
import MenuModal from './MenuModal';
import { MenuSection } from '@/data/menuData';

interface MenuButtonProps {
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall' | 'community';
  menuData: MenuSection[];
}

const MenuButton = ({ pageType, menuData }: MenuButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getAccentColor = () => {
    switch (pageType) {
      case 'cafe':
        return 'hsl(var(--accent-pink))';
      case 'cocktails':
        return 'hsl(var(--accent-lime))';
      case 'beer':
        return 'hsl(var(--accent-orange))';
      case 'kitchens':
        return 'hsl(var(--accent-blood-red))';
      case 'hall':
        return 'hsl(var(--accent-vivid-purple))';
      case 'community':
        return 'hsl(var(--accent-sage-green))';
      default:
        return 'hsl(var(--accent-pink))';
    }
  };

  const accentColor = getAccentColor();

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className={`fixed bottom-20 right-8 z-30 w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 
          flex items-center justify-center group relative ${
            pageType === 'community' 
              ? 'bg-background/85 backdrop-blur-sm' 
              : 'border-2 border-background/30 backdrop-blur-sm bg-background/10 hover:border-background hover:bg-background/20'
          }`}
        onMouseEnter={(e) => {
          if (pageType === 'community') {
            e.currentTarget.style.backgroundColor = accentColor;
            e.currentTarget.style.borderColor = accentColor;
          } else {
            e.currentTarget.style.backgroundColor = accentColor;
            e.currentTarget.style.borderColor = accentColor;
          }
        }}
        onMouseLeave={(e) => {
          if (pageType === 'community') {
            e.currentTarget.style.backgroundColor = 'hsla(0, 0%, 100%, 0.85)';
            e.currentTarget.style.borderColor = '';
          } else {
            e.currentTarget.style.backgroundColor = 'hsla(0, 0%, 100%, 0.1)';
            e.currentTarget.style.borderColor = 'hsla(0, 0%, 100%, 0.3)';
          }
        }}
      >
        {/* Breathing pulse overlay */}
        <div 
          className="absolute inset-0 rounded-full animate-breathing-pulse pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        
        <div className={`relative z-10 transition-colors duration-300 scale-75 ${
          pageType === 'community' ? 'text-foreground [&_svg]:stroke-[3]' : 'text-background'
        }`}>
          <CroftLogo size="lg" />
        </div>
      </button>

      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        pageType={pageType}
        menuData={menuData}
      />
    </>
  );
};

export default MenuButton;