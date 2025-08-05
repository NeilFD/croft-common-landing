import { useEffect } from 'react';
import { X } from 'lucide-react';
import CroftLogo from './CroftLogo';
import { MenuSection } from '@/data/menuData';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall' | 'community';
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
    // Check if this is the home menu by looking at the first section title
    if (menuData.length > 0 && menuData[0].title === 'CROFT COMMON') {
      return 'CROFT COMMON';
    }
    
    switch (pageType) {
      case 'cafe':
        return 'CROFT COMMON CAFÉ';
      case 'cocktails':
        return 'CROFT COMMON COCKTAILS';
      case 'beer':
        return 'CROFT COMMON BEER';
      case 'kitchens':
        return 'CROFT COMMON KITCHENS';
      case 'hall':
        return 'CROFT COMMON HALL';
      case 'community':
        return 'CROFT COMMON COMMUNITY';
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
      case 'hall':
        return 'accent-vivid-purple';
      case 'community':
        return 'accent-electric-blue';
      default:
        return 'accent-pink';
    }
  };

  const accentColor = getAccentColor();

  return (
    <div 
      className="fixed inset-0 z-50 bg-void/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-steel/30 rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-background border-b border-steel/20 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-foreground">
              <CroftLogo />
            </div>
            <h1 className="font-brutalist text-xl text-foreground tracking-wider">
              {getPageTitle()}
            </h1>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full border border-background/30 
              hover:border-${accentColor} hover:bg-${accentColor}/10 
              transition-all duration-300 flex items-center justify-center`}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Scrollable Menu Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
          <div className="space-y-10">
            {menuData.map((section, sectionIndex) => {
              const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD'].includes(section.title);
              
              return (
                <div key={sectionIndex} className="space-y-4">
                  <h2 className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
                    isMajorSection 
                      ? `text-2xl md:text-3xl text-${accentColor} mb-6` 
                      : `text-lg md:text-xl text-${accentColor} mb-4`
                  }`}>
                    {section.title}
                  </h2>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        {item.isEmail ? (
                          <a 
                            href={`mailto:${item.name}`}
                            className={`font-industrial text-lg text-${accentColor} hover:underline transition-all duration-300`}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <h3 
                            className="font-industrial text-lg text-foreground"
                            dangerouslySetInnerHTML={{ __html: item.name }}
                          />
                        )}
                        {item.description && (
                          <p className="font-industrial text-steel text-sm mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.price && (
                        <div className={`font-industrial text-base font-bold text-${accentColor} 
                          flex-shrink-0 text-right`}>
                          {item.price}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;