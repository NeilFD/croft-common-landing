import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CMSKitchensMenu } from '@/components/cms/CMSKitchensMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CMSKitchens: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/cms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CMS
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Kitchens Menu Management</h1>
            <p className="text-foreground/70">
              Manage all kitchen menu content across tabs and recipes
            </p>
          </div>
        </div>

        {/* Menu Tabs Management */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="cafe">Cafe</TabsTrigger>
            <TabsTrigger value="sunday">Sunday</TabsTrigger>
            <TabsTrigger value="hideout">Hideout</TabsTrigger>
            <TabsTrigger value="halls">Halls</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <CMSKitchensMenu 
              key={`main-${refreshTrigger}`}
              tab="main" 
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>

          <TabsContent value="cafe">
            <CMSKitchensMenu 
              key={`cafe-${refreshTrigger}`}
              tab="cafe" 
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>

          <TabsContent value="sunday">
            <CMSKitchensMenu 
              key={`sunday-${refreshTrigger}`}
              tab="sunday" 
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>

          <TabsContent value="hideout">
            <CMSKitchensMenu 
              key={`hideout-${refreshTrigger}`}
              tab="hideout" 
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>

          <TabsContent value="halls">
            <CMSKitchensMenu 
              key={`halls-${refreshTrigger}`}
              tab="halls" 
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CMSKitchens;