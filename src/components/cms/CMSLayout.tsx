import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CMSSidebar } from './CMSSidebar';
import { EditModeProvider } from '@/contexts/EditModeContext';
import { CMSErrorBoundary } from './CMSErrorBoundary';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export const CMSLayout = ({ children }: CMSLayoutProps) => {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <CMSErrorBoundary>
      <EditModeProvider>
        <div className="flex flex-col w-full">
          {/* CMS action bar */}
          <header className="flex items-center justify-between gap-3 h-14 px-3 sm:px-5 border border-border rounded-md bg-background mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? 'Hide CMS navigation' : 'Show CMS navigation'}
              >
                {navOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg uppercase tracking-wide truncate">CMS</h1>
                <p className="hidden sm:block font-cb-sans text-xs text-muted-foreground">Country and Town site content</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Badge variant="outline" className="hidden sm:inline-flex font-cb-sans text-xs">Live</Badge>
              <Button variant="outline" size="sm" className="hidden md:flex gap-2 font-cb-sans">
                <Eye className="h-4 w-4" /><span className="hidden lg:inline">Preview</span>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex gap-2 font-cb-sans">
                <RefreshCw className="h-4 w-4" /><span className="hidden lg:inline">Sync</span>
              </Button>
              <Button size="sm" className="gap-2 font-cb-sans">
                <Save className="h-4 w-4" /><span className="hidden sm:inline">Save All</span>
              </Button>
            </div>
          </header>

          <div className="flex gap-4 min-h-0">
            {navOpen && (
              <aside className="hidden md:block w-64 flex-shrink-0 border border-border rounded-md bg-background overflow-y-auto max-h-[calc(100vh-12rem)] sticky top-4">
                <CMSSidebar />
              </aside>
            )}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </EditModeProvider>
    </CMSErrorBoundary>
  );
};
