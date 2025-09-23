import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunTab } from '@/components/research/RunTab';
import { ManageTab } from '@/components/research/ManageTab';
import { AnalysisTab } from '@/components/research/AnalysisTab';
import CroftLogo from '@/components/CroftLogo';

const Research = () => {
  const [activeTab, setActiveTab] = useState('run');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <CroftLogo size="md" enableDevPanel={false} />
            <div>
              <h1 className="font-bold text-xl">Croft Common</h1>
              <p className="text-sm text-muted-foreground">Field Research</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
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