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
        return 'accent-blood-red';
      case 'hall':
        return 'accent-vivid-purple';
      case 'community':
        return 'accent-sage-green';
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
        className={`bg-background border border-steel/30 rounded-lg w-full overflow-hidden shadow-2xl ${
          pageType === 'community' ? 'max-w-6xl max-h-[90vh]' : 'max-w-5xl max-h-[95vh]'
        }`}
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

        {/* Scrollable Content */}
        <div className={`overflow-y-auto p-6 ${
          pageType === 'community' ? 'max-h-[calc(90vh-120px)]' : 'max-h-[calc(95vh-120px)]'
        }`}>
          {pageType === 'community' ? (
            // Special layout for Common Room content
            <div className="space-y-12">
              {/* What's Next Section */}
              <div className="space-y-6">
                <h2 className={`font-brutalist text-3xl md:text-4xl text-[hsl(var(--${accentColor}))] tracking-wider border-b border-steel/20 pb-4`}>
                  What's Next?
                </h2>
                <div className="space-y-4">
                  <p className="font-industrial text-xl text-foreground leading-relaxed">
                    Gigs, talks, tastings, all sorts.
                  </p>
                  <p className="font-industrial text-lg text-steel leading-relaxed">
                    The calendar never sits still. From low-key launches to big, messy nights — this is where it lands first. Some tickets sell out in hours. Some don't go public at all. You're already on the list.{' '}
                    <a href="#" className={`text-[hsl(var(--${accentColor}))] hover:underline font-semibold transition-all duration-300`}>
                      Let yourself in
                    </a>
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="flex justify-center">
                <div className="text-steel font-industrial text-2xl">⸻</div>
              </div>

              {/* Common People Section */}
              <div className="space-y-6">
                <h2 className={`font-brutalist text-3xl md:text-4xl text-[hsl(var(--${accentColor}))] tracking-wider border-b border-steel/20 pb-4`}>
                  Common People
                </h2>
                <div className="space-y-4">
                  <p className="font-industrial text-xl text-foreground leading-relaxed">
                    The crew behind the counter. And the ones who keep coming back.
                  </p>
                  <p className="font-industrial text-lg text-steel leading-relaxed">
                    We back local. We back talent. We back people doing it right. Members get first dibs on workshops, collabs, and pop-ups from the makers, growers, shakers and pourers we rate. Come learn. Come try. Come talk.{' '}
                    <a href="#" className={`text-[hsl(var(--${accentColor}))] hover:underline font-semibold transition-all duration-300`}>
                      Come Meet
                    </a>
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="flex justify-center">
                <div className="text-steel font-industrial text-2xl">⸻</div>
              </div>

              {/* Common Good Section */}
              <div className="space-y-6">
                <h2 className={`font-brutalist text-3xl md:text-4xl text-[hsl(var(--${accentColor}))] tracking-wider border-b border-steel/20 pb-4`}>
                  Common Good
                </h2>
                <div className="space-y-4">
                  <p className="font-industrial text-xl text-foreground leading-relaxed">
                    We give space. You give time. That's the deal.
                  </p>
                  <p className="font-industrial text-lg text-steel leading-relaxed">
                    We hand the Hall to causes that matter. If you're part of one — or want to help one — this is where you step in. No hashtags. No speeches. Just action. Real things, done quietly, with people who care.{' '}
                    <a href="#" className={`text-[hsl(var(--${accentColor}))] hover:underline font-semibold transition-all duration-300`}>
                      Help out
                    </a>
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="flex justify-center">
                <div className="text-steel font-industrial text-2xl">⸻</div>
              </div>

              {/* Stay Close Section */}
              <div className="space-y-6">
                <h2 className={`font-brutalist text-3xl md:text-4xl text-[hsl(var(--${accentColor}))] tracking-wider border-b border-steel/20 pb-4`}>
                  Stay Close
                </h2>
                <div className="space-y-4">
                  <p className="font-industrial text-xl text-foreground leading-relaxed">
                    First in. Best table. Quiet heads-up.
                  </p>
                  <p className="font-industrial text-lg text-steel leading-relaxed">
                    We don't do loyalty cards. But we notice who sticks around. Stay close and you'll hear about things before they land. Early access to events. Priority tables on busy nights. The odd off-menu thing when it feels right. No noise. No spam. Just the good stuff, first.{' '}
                    <a href="#" className={`text-[hsl(var(--${accentColor}))] hover:underline font-semibold transition-all duration-300`}>
                      If you know, you know
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Standard menu layout for other pages
            <div className="space-y-10">
              {menuData.map((section, sectionIndex) => {
                const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD'].includes(section.title);
                
                return (
                  <div key={sectionIndex} className="space-y-4">
                    <h2 className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
                      isMajorSection 
                        ? `text-2xl md:text-3xl text-[hsl(var(--${accentColor}))] mb-6` 
                        : `text-lg md:text-xl text-[hsl(var(--${accentColor}))] mb-4`
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
                              className={`font-industrial text-lg text-[hsl(var(--${accentColor}))] hover:underline transition-all duration-300`}
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
                          <div className={`font-industrial text-base font-bold text-[hsl(var(--${accentColor}))] 
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
    </div>
  );
};

export default MenuModal;