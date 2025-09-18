import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getKitchensTabData, KitchensMenuSection } from '@/data/kitchensModalMenuData';
import { useKitchensMenuData, KitchensMenuSection as CMSKitchensMenuSection } from '@/hooks/useKitchensCMSData';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface HallMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HallMenuModal: React.FC<HallMenuModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('halls');
  const { isCMSMode } = useCMSMode();
  
  // Fetch CMS data for the active tab (include drafts in CMS mode)
  const { data: cmsData, loading: cmsLoading, error: cmsError } = useKitchensMenuData(activeTab, isCMSMode);
  
  // Use CMS data if available, otherwise fall back to static data
  const getMenuSections = (tabName: string): KitchensMenuSection[] => {
    if (tabName === activeTab && cmsData && cmsData.length > 0 && !cmsError) {
      return cmsData as KitchensMenuSection[];
    }
    // Fallback to static data
    return getKitchensTabData(tabName);
  };

  const renderMenuSection = (sections: KitchensMenuSection[], tabName: string) => (
    <div className="space-y-10">
      {sections.map((section, sectionIndex) => {
        const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD', 'Wood-Fired Pizzas', 'Charcoal Grill', 'Sunday Roasts'].includes(section.title);
        
        return (
          <div key={`${tabName}-${sectionIndex}`} className="space-y-4">
            <CMSText
              page="kitchens"
              section={`menu-${tabName}`}
              contentKey={`section_${sectionIndex}_title`}
              fallback={section.title}
              as="h2"
              className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
                isMajorSection 
                  ? 'text-2xl md:text-3xl text-[hsl(var(--accent-pink))] mb-6' 
                  : 'text-lg md:text-xl text-[hsl(var(--accent-pink))] mb-4'
              }`}
            />
            <div className="space-y-3">
              {section.items.map((item, itemIndex: number) => (
                <div key={`${tabName}-${sectionIndex}-${itemIndex}`} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <CMSText
                      page="kitchens"
                      section={`menu-${tabName}`}
                      contentKey={`section_${sectionIndex}_item_${itemIndex}_name`}
                      fallback={item.name}
                      as="h3"
                      className="font-industrial text-xl font-semibold text-foreground"
                    />
                    {item.description && (
                      <CMSText
                        page="kitchens"
                        section={`menu-${tabName}`}
                        contentKey={`section_${sectionIndex}_item_${itemIndex}_description`}
                        fallback={item.description}
                        as="p"
                        className="font-industrial text-base text-foreground/80 mt-1"
                      />
                    )}
                  </div>
                  {item.price && (
                    <CMSText
                      page="kitchens"
                      section={`menu-${tabName}`}
                      contentKey={`section_${sectionIndex}_item_${itemIndex}_price`}
                      fallback={item.price}
                      as="div"
                      className="font-industrial text-base font-bold text-[hsl(var(--accent-pink))] flex-shrink-0 text-right"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[20000] bg-void/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4 pt-32"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-background border border-steel/30 rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-background border-b border-steel/20 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <h1 className="font-brutalist text-lg md:text-xl text-foreground tracking-wider">
              HALLS & HIDEOUT MENU
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-background/30 hover:border-accent-pink hover:bg-accent-pink/10 transition-all duration-300 flex items-center justify-center flex-shrink-0 ml-2 cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 pt-6 pb-12 max-h-[calc(95vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-background border border-steel/20">
              <TabsTrigger 
                value="halls" 
                className="font-brutalist text-sm tracking-wider data-[state=active]:text-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                HALLS
              </TabsTrigger>
              <TabsTrigger 
                value="hideout" 
                className="font-brutalist text-sm tracking-wider data-[state=active]:text-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                HIDEOUT
              </TabsTrigger>
            </TabsList>

            <TabsContent value="halls" className="mt-0">
              {cmsLoading && activeTab === 'halls' ? (
                <div className="text-center py-8 text-foreground/70">Loading menu...</div>
              ) : (
                renderMenuSection(getMenuSections('halls'), 'halls')
              )}
            </TabsContent>

            <TabsContent value="hideout" className="mt-0">
              {cmsLoading && activeTab === 'hideout' ? (
                <div className="text-center py-8 text-foreground/70">Loading menu...</div>
              ) : (
                renderMenuSection(getMenuSections('hideout'), 'hideout')
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default HallMenuModal;