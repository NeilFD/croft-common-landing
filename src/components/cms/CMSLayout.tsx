import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CMSSidebar } from './CMSSidebar';
import { CMSHeader } from './CMSHeader';
import { EditModeProvider } from '@/contexts/EditModeContext';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export const CMSLayout = ({ children }: CMSLayoutProps) => {
  return (
    <EditModeProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full overflow-x-hidden">
          <CMSSidebar />
          <div className="flex-1 min-w-0 w-full">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </EditModeProvider>
  );
};