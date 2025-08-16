import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import CroftLogo from '../CroftLogo';
import { MenuSection } from '@/data/menuData';
import { CMSText } from './CMSText';
import { useEditMode } from '@/contexts/EditModeContext';

interface EditableMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall' | 'community' | 'common-room';
  menuData: MenuSection[];
}

const EditableMenuModal = ({ isOpen, onClose, pageType, menuData }: EditableMenuModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEditMode } = useEditMode();

  const handleClose = () => {
    console.log('Modal close button clicked');
    onClose();
  };

  const handleBackdropClick = () => {
    console.log('Modal backdrop clicked');
    onClose();
  };

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
        return 'accent-pink';
      case 'hall':
        return 'accent-pink';
      case 'community':
        return 'accent-electric-blue';
      case 'common-room':
        return 'accent-sage-green';
      default:
        return 'accent-pink';
    }
  };

  const accentColor = getAccentColor();
  const isNeutral = pageType === 'beer' || pageType === 'kitchens' || pageType === 'cafe' || pageType === 'hall';

  return (
    <div 
      className="fixed top-16 left-0 right-0 bottom-0 bg-void/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4 z-30"
      onClick={handleBackdropClick}
    >
      <div 
        ref={containerRef}
        className={`bg-background border border-steel/30 rounded-lg w-full overflow-hidden shadow-2xl ${
          pageType === 'community' || pageType === 'common-room' ? 'max-w-7xl max-h-[90vh]' : 'max-w-5xl max-h-[95vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-background border-b border-steel/20 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <div className="text-foreground flex-shrink-0">
              <CroftLogo size="lg" />
            </div>
            <CMSText
              page={pageType}
              section="modal"
              contentKey="title"
              fallback={getPageTitle()}
              as="h1"
              className="font-brutalist text-lg md:text-xl text-foreground tracking-wider truncate"
            />
          </div>
          <div className="flex items-center gap-1">
            {isEditMode && (
              <div className="text-xs text-muted-foreground mr-3">Click text to edit</div>
            )}
            <button
              onClick={handleClose}
              className={`w-10 h-10 rounded-full border border-background/30 
                ${pageType === 'hall' ? 'hover:border-steel hover:bg-steel/10' : `hover:border-${accentColor} hover:bg-${accentColor}/10`} 
                transition-all duration-300 flex items-center justify-center flex-shrink-0 ml-2`}
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto p-6 relative ${
          pageType === 'community' || pageType === 'common-room' ? 'max-h-[calc(90vh-120px)]' : 'max-h-[calc(95vh-120px)]'
        }`}>
          <div className="space-y-10">
            {/* Special handling for Hall and Community - plain text descriptions */}
            {(pageType === 'hall' || pageType === 'community') ? (
              <div className="space-y-6">
                <CMSText
                  page={pageType}
                  section="modal"
                  contentKey="description"
                  fallback={pageType === 'hall' 
                    ? "An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life's big moments. Strip it back. Fill it up.\n\nContact us for bookings and events."
                    : "We believe in community. We believe in supporting local. We believe in making a difference.\n\nJoin us in making Croft Common a place where everyone belongs."
                  }
                  as="div"
                  className="font-industrial text-lg text-foreground max-w-4xl mx-auto leading-relaxed whitespace-pre-line text-center"
                />
              </div>
            ) : (
              /* Menu items for Cafe, Cocktails, Beer, Kitchens */
              menuData.map((section, sectionIndex) => {
                const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD'].includes(section.title);
                
                return (
                  <div key={sectionIndex} className="space-y-4">
                    <CMSText
                      page={pageType}
                      section="menu"
                      contentKey={`section_${sectionIndex}_title`}
                      fallback={section.title}
                      as="h2"
                      className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
                        isMajorSection 
                          ? `text-2xl md:text-3xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-6` 
                          : `text-lg md:text-xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-4`
                      }`}
                    />
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            {item.isEmail ? (
                              <a 
                                href={`mailto:${item.name}`}
                                className={`font-industrial text-lg ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} hover:underline transition-all duration-300`}
                              >
                                <CMSText
                                  page={pageType}
                                  section="menu"
                                  contentKey={`section_${sectionIndex}_item_${itemIndex}_name`}
                                  fallback={item.name}
                                  as="div"
                                  className="inline"
                                />
                              </a>
                            ) : item.isLink ? (
                              <button 
                                className={`font-industrial text-lg ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} hover:underline transition-all duration-300 cursor-pointer text-left`}
                              >
                                <CMSText
                                  page={pageType}
                                  section="menu"
                                  contentKey={`section_${sectionIndex}_item_${itemIndex}_name`}
                                  fallback={item.name}
                                  as="div"
                                  className="inline"
                                />
                              </button>
                            ) : (
                              <CMSText
                                page={pageType}
                                section="menu"
                                contentKey={`section_${sectionIndex}_item_${itemIndex}_name`}
                                fallback={item.name}
                                as="h3"
                                className="font-industrial text-lg text-foreground"
                              />
                            )}
                            {item.description && (
                              <CMSText
                                page={pageType}
                                section="menu"
                                contentKey={`section_${sectionIndex}_item_${itemIndex}_description`}
                                fallback={item.description}
                                as="p"
                                className="font-industrial text-steel text-sm mt-1"
                              />
                            )}
                          </div>
                          {item.price && (
                            <CMSText
                              page={pageType}
                              section="menu"
                              contentKey={`section_${sectionIndex}_item_${itemIndex}_price`}
                              fallback={item.price}
                              as="div"
                              className={`font-industrial text-base font-bold ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} 
                                flex-shrink-0 text-right`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableMenuModal;