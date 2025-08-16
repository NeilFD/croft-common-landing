import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CMSSidebar } from './CMSSidebar';
import { CMSHeader } from './CMSHeader';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export const CMSLayout = ({ children }: CMSLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CMSSidebar />
        <SidebarInset className="flex-1">
          <CMSHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};