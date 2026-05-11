import { useState, Suspense } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import { PropertyProvider } from '@/contexts/PropertyContext';
import { CMS_PAGES_BY_SLUG } from '@/data/cmsPages';

interface CMSVisualEditorProps {
  currentPage: string;
}

export const CMSVisualEditor = ({ currentPage }: CMSVisualEditorProps) => {
  const { isEditMode } = useEditMode();

  const normalizedPage = currentPage.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
  const entry = CMS_PAGES_BY_SLUG[normalizedPage];
  const PageComponent = entry?.component;
  const propertyKey = entry?.property ?? null;

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
            <div className="mt-2 text-xs">{Object.keys(CMS_PAGES_BY_SLUG).join(', ')}</div>
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
