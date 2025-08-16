import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CMSSidebar } from './CMSSidebar';
import { CMSHeader } from './CMSHeader';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export const CMSLayout = ({ children }: CMSLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full relative">
        <CMSSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <CMSHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};