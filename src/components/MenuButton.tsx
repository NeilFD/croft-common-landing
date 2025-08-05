import { useState } from 'react';
import CroftLogo from './CroftLogo';
import MenuModal from './MenuModal';
import { MenuSection } from '@/data/menuData';

interface MenuButtonProps {
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens';
  menuData: MenuSection[];
}

const MenuButton = ({ pageType, menuData }: MenuButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getAccentColor = () => {
    switch (pageType) {
      case 'cafe':
        return 'accent-pink';
      case 'cocktails':
        return 'accent-lime';
      case 'beer':
        return 'accent-orange';
      case 'kitchens':
        return 'accent-blood-red';
      default:
        return 'accent-pink';
    }
  };

  const accentColor = getAccentColor();

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className={`fixed bottom-20 right-8 z-30 w-14 h-14 rounded-full border-2 border-background/30 
          backdrop-blur-sm transition-all duration-300 hover:scale-105 
          bg-background/10 hover:bg-${accentColor} hover:border-${accentColor}
          flex items-center justify-center group`}
      >
        <div className={`text-background transition-colors duration-300 group-hover:text-background scale-75`}>
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