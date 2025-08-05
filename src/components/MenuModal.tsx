import { useEffect } from 'react';
import { X } from 'lucide-react';
import CroftLogo from './CroftLogo';
import { MenuSection } from '@/data/menuData';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens';
  menuData: MenuSection[];
}

const MenuModal = ({ isOpen, onClose, pageType, menuData }: MenuModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getPageTitle = () => {
    switch (pageType) {
      case 'cafe':
        return 'CROFT COMMON CAFÉ';
      case 'cocktails':
        return 'CROFT COMMON COCKTAILS';
      case 'beer':
        return 'CROFT COMMON BEER';
      case 'kitchens':
        return 'CROFT COMMON KITCHENS';
      default:
        return 'CROFT COMMON';
    }
  };

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
    <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm animate-fade-in">
      <div className="min-h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-void/90 backdrop-blur-md border-b border-steel/20">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-background">
                <CroftLogo />
              </div>
              <h1 className="font-brutalist text-xl text-background tracking-wider">
                {getPageTitle()}
              </h1>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full border border-background/30 
                hover:border-${accentColor} hover:bg-${accentColor}/10 
                transition-all duration-300 flex items-center justify-center`}
            >
              <X className="w-5 h-5 text-background" />
            </button>
          </div>
        </header>

        {/* Menu Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {menuData.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-12">
                <h2 className={`font-brutalist text-2xl md:text-3xl text-${accentColor} 
                  mb-6 tracking-wider border-b border-steel/20 pb-2`}>
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-industrial text-lg text-background font-medium">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="font-industrial text-steel text-sm mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.price && (
                        <div className={`font-industrial text-lg font-bold text-${accentColor} ml-4`}>
                          {item.price}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;