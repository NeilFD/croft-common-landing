import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunTab } from '@/components/research/RunTab';
import { ManageTab } from '@/components/research/ManageTab';
import { AnalysisTab } from '@/components/research/AnalysisTab';
import CroftLogo from '@/components/CroftLogo';

const Research = () => {
  const [activeTab, setActiveTab] = useState('run');

  useEffect(() => {
    const { body } = document;
    // Reset any accidental global pointer blocking
    if (body.style.pointerEvents === 'none') {
      body.style.pointerEvents = 'auto';
    }
    body.classList.remove('gesture-drawing');
    body.removeAttribute('data-pointer-blocked');
  }, []);

  return (
    <div className="relative z-[60] min-h-screen bg-background pointer-events-auto">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <CroftLogo size="sm" enableDevPanel={false} />
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg sm:text-xl truncate">Croft Common</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Field Research</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <Tabs value={activeTab} onValueChange={(v) => { console.log('Research Tabs change:', v); setActiveTab(v); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
            <TabsTrigger value="run" className="text-xs sm:text-sm px-2 sm:px-3">Run</TabsTrigger>
            <TabsTrigger value="manage" className="text-xs sm:text-sm px-2 sm:px-3">Manage</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm px-2 sm:px-3">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-6">
            <RunTab />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <ManageTab />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <AnalysisTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Research;