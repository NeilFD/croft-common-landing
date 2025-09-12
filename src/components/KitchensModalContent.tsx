import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getKitchensTabData } from '@/data/kitchensModalMenuData';

interface KitchensModalContentProps {
  accentColor: string;
  isNeutral: boolean;
}

const KitchensModalContent: React.FC<KitchensModalContentProps> = ({ accentColor, isNeutral }) => {
  const [activeTab, setActiveTab] = useState('main');

  const renderMenuSection = (sections: any[], tabName: string) => (
    <div className="space-y-10">
      {sections.map((section, sectionIndex) => {
        const isMajorSection = ['PIZZA - WOOD-FIRED', 'GRILL', 'MEXICAN', 'ASIAN STREET FOOD', 'Wood-Fired Pizzas', 'Charcoal Grill', 'Sunday Roasts'].includes(section.title);
        
        return (
          <div key={`${tabName}-${sectionIndex}`} className="space-y-4">
            <h2 className={`font-brutalist tracking-wider border-b border-steel/20 pb-3 ${
              isMajorSection 
                ? `text-2xl md:text-3xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-6` 
                : `text-lg md:text-xl ${isNeutral ? 'text-foreground' : `text-[hsl(var(--${accentColor}))]`} mb-4`
            }`}>
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item: any, itemIndex: number) => (
                <div key={`${tabName}-${sectionIndex}-${itemIndex}`} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 
                      className="font-industrial text-lg text-foreground"
                      dangerouslySetInnerHTML={{ __html: item.name }}
                    />
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
  );

  return (
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
        {renderMenuSection(getKitchensTabData('main'), 'main')}
      </TabsContent>

      <TabsContent value="cafe" className="mt-0">
        {renderMenuSection(getKitchensTabData('cafe'), 'cafe')}
      </TabsContent>

      <TabsContent value="sunday" className="mt-0">
        {renderMenuSection(getKitchensTabData('sunday'), 'sunday')}
      </TabsContent>

      <TabsContent value="hideout" className="mt-0">
        {renderMenuSection(getKitchensTabData('hideout'), 'hideout')}
      </TabsContent>

      <TabsContent value="halls" className="mt-0">
        {renderMenuSection(getKitchensTabData('halls'), 'halls')}
      </TabsContent>
    </Tabs>
  );
};

export default KitchensModalContent;