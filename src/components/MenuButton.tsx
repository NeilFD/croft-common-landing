import { useState } from 'react';
import CroftLogo from './CroftLogo';
import MenuModal from './MenuModal';
import { MenuSection } from '@/data/menuData';

interface MenuButtonProps {
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall';
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
      default:
        return 'hsl(var(--accent-pink))';
    }
  };

  const accentColor = getAccentColor();

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-20 right-8 z-30 w-14 h-14 rounded-full border-2 border-background/30 
          backdrop-blur-sm transition-all duration-300 hover:scale-105 
          bg-background/10 hover:border-background
          flex items-center justify-center group"
        style={{
          '--hover-bg': accentColor,
        } as any}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = accentColor;
          e.currentTarget.style.borderColor = accentColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'hsla(0, 0%, 100%, 0.1)';
          e.currentTarget.style.borderColor = 'hsla(0, 0%, 100%, 0.3)';
        }}
      >
        <div className="text-background transition-colors duration-300 scale-50">
          <CroftLogo />
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