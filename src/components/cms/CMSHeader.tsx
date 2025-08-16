import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, RefreshCw } from 'lucide-react';

export const CMSHeader = () => {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold">Content Management System</h1>
          <p className="text-sm text-muted-foreground">Manage your website content</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          Live Website
        </Badge>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync
        </Button>
        
        <Button size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save All
        </Button>
      </div>
    </header>
  );
};