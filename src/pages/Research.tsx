import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunTab } from '@/components/research/RunTab';
import { ManageTab } from '@/components/research/ManageTab';
import { AnalysisTab } from '@/components/research/AnalysisTab';

const Research = () => {
  const { managementUser, loading } = useManagementAuth();
  const [activeTab, setActiveTab] = useState('run');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="font-brutalist text-xl mb-2">Loading...</div>
          <div className="font-industrial text-muted-foreground">Verifying access...</div>
        </div>
      </div>
    );
  }

  if (!managementUser?.hasAccess) {
    return <Navigate to="/management/login" replace />;
  }

  return (
    <ManagementLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-brutalist text-2xl md:text-3xl font-black uppercase tracking-wider mb-2">
            Field Research
          </h1>
          <p className="font-industrial text-sm text-muted-foreground">
            Conduct venue research and capacity analysis
          </p>
        </div>

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
      </div>
    </ManagementLayout>
  );
};

export default Research;