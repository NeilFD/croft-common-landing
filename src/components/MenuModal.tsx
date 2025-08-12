import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CroftLogo from './CroftLogo';
import { MenuSection } from '@/data/menuData';
import { GuideArrows } from '@/components/ui/GuideArrows';
import useGestureDetection from '@/hooks/useGestureDetection';
import SecretBeerModal from './SecretBeerModal';
import SecretKitchensModal from './SecretKitchensModal';
import useSecretWordOfTheDay from '@/hooks/useSecretWordOfTheDay';
import LoyaltyCardModal from '@/components/loyalty/LoyaltyCardModal';
import CommonMembershipModal from '@/components/CommonMembershipModal';
import { toast } from '@/hooks/use-toast';
import SecretCinemaModal from '@/components/SecretCinemaModal';
import SecretLuckySevenModal from './SecretLuckySevenModal';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall' | 'community' | 'common-room';
  menuData: MenuSection[];
}

const MenuModal = ({ isOpen, onClose, pageType, menuData }: MenuModalProps) => {
  const navigate = useNavigate();
  const [showSecret, setShowSecret] = useState(false);
  const [showMembership, setShowMembership] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const secretWord = useSecretWordOfTheDay();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setShowSecret(false);
      setShowMembership(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSecretSuccess = useCallback(() => {
    try { window.getSelection()?.removeAllRanges(); } catch {}
    if (pageType === 'community') {
      onClose();
      toast({ title: 'Access granted', description: 'Common Good Fund unlocked', duration: 1800 });
      navigate('/common-good');
    } else {
      setShowSecret(true);
    }
  }, [navigate, onClose, pageType]);

  const {
    isDrawing,
    startGesture,
    addPoint,
    endGesture
  } = useGestureDetection(handleSecretSuccess);

  const getEventPosition = useCallback((event: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    if ('touches' in event && event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in event) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  }, []);
  
  // Detect if this is the standalone home menu (no gestures here)
  const isHomeMenu = menuData.length > 0 && menuData[0].title === 'CROFT COMMON';
  // Enable secret gesture for specific pages only (NEVER for the standalone home menu)
  const isSecretEnabled = !isHomeMenu && (pageType === 'beer' || pageType === 'kitchens' || pageType === 'cafe' || pageType === 'community' || pageType === 'hall' || pageType === 'cocktails');
  const showGestureIndicator = isSecretEnabled;
  // Note: Do NOT preventDefault here to keep scrolling/interaction inside the modal.
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!isSecretEnabled) return;
    if (containerRef.current) containerRef.current.style.userSelect = 'none';
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isSecretEnabled]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isSecretEnabled || !isDrawing) return;
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing, isSecretEnabled]);

  const handleTouchEnd = useCallback((_event: React.TouchEvent) => {
    if (!isSecretEnabled) return;
    endGesture();
    if (containerRef.current) containerRef.current.style.userSelect = '';
  }, [endGesture, isSecretEnabled]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isSecretEnabled) return;
    if (containerRef.current) containerRef.current.style.userSelect = 'none';
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isSecretEnabled]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSecretEnabled || !isDrawing) return;
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing, isSecretEnabled]);

  const handleMouseUp = useCallback((_event: React.MouseEvent) => {
    if (!isSecretEnabled) return;
    endGesture();
    if (containerRef.current) containerRef.current.style.userSelect = '';
  }, [endGesture, isSecretEnabled]);

  if (!isOpen) return null;

  const getPageTitle = () => {
    // Check if this is the home menu by looking at the first section title
    if (menuData.length > 0 && menuData[0].title === 'CROFT COMMON') {
      return 'CROFT COMMON';
    }
    
    // Check if this is the common room by looking at the first section title
    if (menuData.length > 0 && menuData[0].title === 'THE COMMON ROOM') {
      return 'THE COMMON ROOM';
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
      case 'common-room':
        return 'THE COMMON ROOM';
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
      className="fixed inset-0 z-50 bg-void/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4"
      onClick={(e) => { if (showSecret) { e.stopPropagation(); return; } onClose(); }}
    >
      <div 
        ref={containerRef}
        className={`bg-background border border-steel/30 rounded-lg w-full overflow-hidden shadow-2xl ${
          pageType === 'community' || pageType === 'common-room' ? 'max-w-7xl max-h-[90vh]' : 'max-w-5xl max-h-[95vh]'
        }${isSecretEnabled && isDrawing ? ' select-none' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Header */}
        <div className="bg-background border-b border-steel/20 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <div className="text-foreground flex-shrink-0">
              <CroftLogo />
            </div>
            <h1 className="font-brutalist text-lg md:text-xl text-foreground tracking-wider truncate">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <GuideArrows contrast="neutral" className="mr-1" />
            <button
              onClick={onClose}
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
          {/* Secret gesture indicator in top-right corner of content */}
          {showGestureIndicator && (
            <div className="absolute top-4 right-4 z-10">
              <img
                src="/lovable-uploads/6dd9122c-afc7-40b6-9cb4-48b5c1f0a84d.png"
                alt="Secret 7 gesture available"
                loading="lazy"
                className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity"
                title="Secret 7 gesture available"
              />
            </div>
          )}
          {false ? (
            <div></div>
          ) : (
            <div className="space-y-10">
              {menuData.map((section, sectionIndex) => {
                const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD'].includes(section.title);
                
                return (
                  <div key={sectionIndex} className="space-y-4">
                    <h2 className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
                      isMajorSection 
                        ? `text-2xl md:text-3xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-6` 
                        : `text-lg md:text-xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-4`
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
                                className={`font-industrial text-lg ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} hover:underline transition-all duration-300`}
                              >
                                {item.name}
                              </a>
                            ) : item.isLink ? (
                              <button 
                                className={`font-industrial text-lg ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} hover:underline transition-all duration-300 cursor-pointer text-left`}
                                onClick={() => {
                                  if (item.name.includes('Take a look')) {
                                    onClose();
                                    navigate('/calendar');
                                  } else if (item.name.toLowerCase().includes('common membership')) {
                                    setShowMembership(true);
                                  } else {
                                    console.log('Navigate to:', item.name);
                                  }
                                }}
                                dangerouslySetInnerHTML={{ __html: item.name }}
                              />
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
                            <div className={`font-industrial text-base font-bold ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} 
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
          )}
        </div>
      </div>

      {/* Secret modal overlays */}
      {pageType === 'cocktails' && (
        <SecretLuckySevenModal
          open={showSecret}
          onClose={() => setShowSecret(false)}
        />
      )}
      {pageType === 'beer' && (
        <SecretBeerModal
          open={showSecret}
          onClose={() => setShowSecret(false)}
          secretWord={secretWord}
        />
      )}
      {pageType === 'kitchens' && (
        <SecretKitchensModal
          open={showSecret}
          onClose={() => setShowSecret(false)}
        />
      )}
      {pageType === 'cafe' && (
        <LoyaltyCardModal
          open={showSecret}
          onClose={() => setShowSecret(false)}
        />
      )}
      {pageType === 'common-room' && (
        <CommonMembershipModal
          open={showMembership}
          onClose={() => setShowMembership(false)}
        />
      )}
      {pageType === 'hall' && (
        <SecretCinemaModal
          open={showSecret}
          onClose={() => setShowSecret(false)}
        />
      )}
    </div>
  );
};

export default MenuModal;
