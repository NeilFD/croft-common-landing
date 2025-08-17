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
        <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
          <CMSHeader />
          <div className="flex flex-1 min-h-0">
            <CMSSidebar />
            <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EditModeProvider>
  );
};