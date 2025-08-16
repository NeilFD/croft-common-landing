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
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full relative">
          <CMSSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </EditModeProvider>
  );
};