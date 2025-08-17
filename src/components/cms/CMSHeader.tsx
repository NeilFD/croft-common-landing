import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, RefreshCw } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';

export const CMSHeader = () => {
  return (
    <header className="flex items-center justify-between h-16 px-3 sm:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <SidebarTrigger className="p-2 hover:bg-accent rounded-md border border-border bg-background shadow-sm flex-shrink-0" />
        <CroftLogo size="lg" className="hidden sm:block ml-2" priority />
        <div className="hidden lg:flex flex-col">
          <h2 className="text-lg font-bold tracking-wide text-foreground">CROFT COMMON</h2>
        </div>
        <div className="hidden lg:block border-l border-border h-8 mx-2" />
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold truncate">CMS</h1>
          <p className="hidden sm:block text-sm text-muted-foreground">Manage your website content</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <Badge variant="outline" className="hidden sm:inline-flex text-xs">
          Live Website
        </Badge>
        
        <Button variant="outline" size="sm" className="hidden md:flex gap-2">
          <Eye className="h-4 w-4" />
          <span className="hidden lg:inline">Preview</span>
        </Button>
        
        <Button variant="outline" size="sm" className="hidden md:flex gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden lg:inline">Sync</span>
        </Button>
        
        <Button size="sm" className="gap-1 sm:gap-2">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save All</span>
        </Button>
      </div>
    </header>
  );
};