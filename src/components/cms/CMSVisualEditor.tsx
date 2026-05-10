import { useState, Suspense, lazy } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import { PropertyProvider } from '@/contexts/PropertyContext';
import type { PropertyKey } from '@/data/brand';
import { toast } from '@/hooks/use-toast';

// Crazy Bear pages
import {
  CountryHome, CountryPub, CountryPubFood, CountryPubDrink, CountryPubHospitality,
  CountryRooms, CountryRoomTypes, CountryRoomGallery,
  CountryParties, CountryEvents, CountryWeddings, CountryBirthdays, CountryBusiness,
  TownHome, TownFood, TownBlackBear, TownBnB, TownHomThai,
  TownDrink, TownCocktails,
  TownRooms, TownRoomTypes, TownRoomGallery, TownPool,
} from '@/pages/property';
import TownCulture from '@/pages/property/TownCulture';
import CountryCulture from '@/pages/property/CountryCulture';
import About from '@/pages/crazybear/About';

// Global preview pages
import CMSFooterPreview from '@/pages/CMSFooterPreview';
import CMSNavigationPreview from '@/pages/CMSNavigationPreview';
import CMSEmailTemplates from '@/pages/CMSEmailTemplates';

interface CMSVisualEditorProps {
  currentPage: string;
}

const pageComponents: Record<string, React.ComponentType> = {
  // Country
  'country': CountryHome,
  'country/pub': CountryPub,
  'country/pub/food': CountryPubFood,
  'country/pub/drink': CountryPubDrink,
  'country/pub/hospitality': CountryPubHospitality,
  'country/rooms': CountryRooms,
  'country/rooms/types': CountryRoomTypes,
  'country/rooms/gallery': CountryRoomGallery,
  'country/parties': CountryParties,
  'country/events': CountryEvents,
  'country/events/weddings': CountryWeddings,
  'country/events/birthdays': CountryBirthdays,
  'country/events/business': CountryBusiness,
  // Town
  'town': TownHome,
  'town/food': TownFood,
  'town/food/black-bear': TownBlackBear,
  'town/food/bnb': TownBnB,
  'town/food/hom-thai': TownHomThai,
  'town/drink': TownDrink,
  'town/drink/cocktails': TownCocktails,
  'town/rooms': TownRooms,
  'town/rooms/types': TownRoomTypes,
  'town/rooms/gallery': TownRoomGallery,
  'town/pool': TownPool,
  'town/culture': TownCulture,
  'country/culture': CountryCulture,
  'about': About,
  // Global
  'global/footer': CMSFooterPreview,
  'global/navigation': CMSNavigationPreview,
  'global/email-templates': CMSEmailTemplates,
};

export const CMSVisualEditor = ({ currentPage }: CMSVisualEditorProps) => {
  const { isEditMode } = useEditMode();

  const normalizedPage = currentPage.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
  const PageComponent = pageComponents[normalizedPage];
  const propertyKey: PropertyKey | null = normalizedPage.startsWith('country')
    ? 'country'
    : normalizedPage.startsWith('town')
    ? 'town'
    : null;

  if (!PageComponent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Page not editable</h2>
          <p className="text-muted-foreground mb-4">
            "{currentPage}" is not yet wired into the CMS preview.
          </p>
          <div className="text-sm text-muted-foreground">
            <strong>Available pages:</strong>
            <div className="mt-2 text-xs">{Object.keys(pageComponents).join(', ')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className={`transition-all duration-200 ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}>
          <CMSModeProvider isCMSMode={true}>
            <Suspense fallback={<div className="p-6 text-muted-foreground">Loading preview...</div>}>
              {propertyKey ? (
                <PropertyProvider property={propertyKey}>
                  <PageComponent />
                </PropertyProvider>
              ) : (
                <PageComponent />
              )}
            </Suspense>
          </CMSModeProvider>
        </div>
      </div>

      {isEditMode && (
        <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Click text to edit
        </div>
      )}
    </div>
  );
};
