import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getKitchensTabData, KitchensMenuSection } from '@/data/kitchensModalMenuData';
import { useKitchensMenuData, KitchensMenuSection as CMSKitchensMenuSection } from '@/hooks/useKitchensCMSData';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface KitchensModalContentProps {
  accentColor: string;
  isNeutral: boolean;
}

const KitchensModalContent: React.FC<KitchensModalContentProps> = ({ accentColor, isNeutral }) => {
  const [activeTab, setActiveTab] = useState('main');
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
                  ? `text-2xl md:text-3xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-6` 
                  : `text-lg md:text-xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-4`
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
                      className="font-industrial text-lg text-foreground"
                    />
                    {item.description && (
                      <CMSText
                        page="kitchens"
                        section={`menu-${tabName}`}
                        contentKey={`section_${sectionIndex}_item_${itemIndex}_description`}
                        fallback={item.description}
                        as="p"
                        className="font-industrial text-lg text-foreground mt-1"
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
                      className={`font-industrial text-base font-bold ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} 
                        flex-shrink-0 text-right`}
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

  return (
    <div className="space-y-6">
      {/* Modal Title */}
      <div className="text-center border-b border-steel/20 pb-4">
        <h1 className="font-brutalist text-foreground tracking-wider text-2xl md:text-3xl leading-none">
          CROFT COMMON KITCHEN
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList 
        className={`grid w-full grid-cols-5 mb-8 bg-background border border-steel/20 ${
          isNeutral ? 'data-[state=active]:bg-foreground/10' : ''
        }`}
      >
        <TabsTrigger 
          data-interactive="true"
          value="main" 
          className={`font-brutalist text-sm tracking-wider ${
            isNeutral ? 'data-[state=active]:text-foreground' : `data-[state=active]:text-[hsl(var(--${accentColor}))] hover:text-[hsl(var(--${accentColor}))]`
          }`}
        >
          MAIN
        </TabsTrigger>
        <TabsTrigger 
          data-interactive="true"
          value="cafe" 
          className={`font-brutalist text-sm tracking-wider ${
            isNeutral ? 'data-[state=active]:text-foreground' : `data-[state=active]:text-[hsl(var(--${accentColor}))] hover:text-[hsl(var(--${accentColor}))]`
          }`}
        >
          CAFÉ
        </TabsTrigger>
        <TabsTrigger 
          data-interactive="true"
          value="sunday" 
          className={`font-brutalist text-sm tracking-wider ${
            isNeutral ? 'data-[state=active]:text-foreground' : `data-[state=active]:text-[hsl(var(--${accentColor}))] hover:text-[hsl(var(--${accentColor}))]`
          }`}
        >
          SUNDAY
        </TabsTrigger>
        <TabsTrigger 
          data-interactive="true"
          value="hideout" 
          className={`font-brutalist text-sm tracking-wider ${
            isNeutral ? 'data-[state=active]:text-foreground' : `data-[state=active]:text-[hsl(var(--${accentColor}))] hover:text-[hsl(var(--${accentColor}))]`
          }`}
        >
          HIDEOUT
        </TabsTrigger>
        <TabsTrigger 
          data-interactive="true"
          value="halls" 
          className={`font-brutalist text-sm tracking-wider ${
            isNeutral ? 'data-[state=active]:text-foreground' : `data-[state=active]:text-[hsl(var(--${accentColor}))] hover:text-[hsl(var(--${accentColor}))]`
          }`}
        >
          HALLS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="main" className="mt-0">
        {cmsLoading && activeTab === 'main' ? (
          <div className="text-center py-8 text-foreground/70">Loading menu...</div>
        ) : (
          renderMenuSection(getMenuSections('main'), 'main')
        )}
      </TabsContent>

      <TabsContent value="cafe" className="mt-0">
        {renderMenuSection(getMenuSections('cafe'), 'cafe')}
      </TabsContent>

      <TabsContent value="sunday" className="mt-0">
        {renderMenuSection(getMenuSections('sunday'), 'sunday')}
      </TabsContent>

      <TabsContent value="hideout" className="mt-0">
        {renderMenuSection(getMenuSections('hideout'), 'hideout')}
      </TabsContent>

      <TabsContent value="halls" className="mt-0">
        {renderMenuSection(getMenuSections('halls'), 'halls')}
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default KitchensModalContent;