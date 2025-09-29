import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader, Plus, FileText } from 'lucide-react';
import { useEventMenus, useEventStaffing, useEventSchedule, useEventRoomLayouts, useEventEquipment, useBEOMutations } from '@/hooks/useBEOData';
import { MenuBuilder } from './MenuBuilder';
import { StaffingBuilder } from './StaffingBuilder';
import { ScheduleBuilder } from './ScheduleBuilder';
import { RoomLayoutBuilder } from './RoomLayoutBuilder';
import { EquipmentBuilder } from './EquipmentBuilder';
import { ContactBuilder } from './ContactBuilder';
import { CostSummary } from './CostSummary';

interface BEOBuilderProps {
  eventId: string;
  eventData: any;
  onBEOGenerated?: () => void;
}

export const BEOBuilder: React.FC<BEOBuilderProps> = ({
  eventId,
  eventData,
  onBEOGenerated
}) => {
  const [activeTab, setActiveTab] = useState("menu");

  const { data: menus = [], isLoading: menusLoading } = useEventMenus(eventId);
  const { data: staffing = [], isLoading: staffingLoading } = useEventStaffing(eventId);
  const { data: schedule = [], isLoading: scheduleLoading } = useEventSchedule(eventId);
  const { data: layouts = [], isLoading: layoutsLoading } = useEventRoomLayouts(eventId);
  const { data: equipment = [], isLoading: equipmentLoading } = useEventEquipment(eventId);

  const { generateBEO } = useBEOMutations(eventId);

  const isLoading = menusLoading || staffingLoading || scheduleLoading || layoutsLoading || equipmentLoading;

  const handleGenerateBEO = () => {
    generateBEO.mutate(undefined, {
      onSuccess: () => {
        onBEOGenerated?.();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading BEO data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BEO Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Oswald'] text-2xl">Banquet Event Order</CardTitle>
              <CardDescription className="font-['Work_Sans']">
                Complete operational details for {eventData?.title}
              </CardDescription>
            </div>
            <Button 
              onClick={handleGenerateBEO}
              disabled={generateBEO.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {generateBEO.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate BEO PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* BEO Builder Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="menu" className="font-['Work_Sans']">Menu</TabsTrigger>
          <TabsTrigger value="staffing" className="font-['Work_Sans']">Staffing</TabsTrigger>
          <TabsTrigger value="schedule" className="font-['Work_Sans']">Schedule</TabsTrigger>
          <TabsTrigger value="layout" className="font-['Work_Sans']">Layout</TabsTrigger>
          <TabsTrigger value="equipment" className="font-['Work_Sans']">Equipment</TabsTrigger>
          <TabsTrigger value="contacts" className="font-['Work_Sans']">Contacts</TabsTrigger>
          <TabsTrigger value="costs" className="font-['Work_Sans']">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <MenuBuilder 
            eventId={eventId} 
            menus={menus} 
          />
        </TabsContent>

        <TabsContent value="staffing" className="space-y-4">
          <StaffingBuilder 
            eventId={eventId} 
            staffing={staffing} 
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleBuilder 
            eventId={eventId} 
            schedule={schedule}
            eventData={eventData}
          />
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <RoomLayoutBuilder 
            eventId={eventId} 
            layouts={layouts} 
          />
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <EquipmentBuilder 
            eventId={eventId} 
            equipment={equipment} 
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <ContactBuilder 
            eventId={eventId}
            eventData={eventData}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostSummary 
            eventId={eventId}
            eventData={eventData}
            equipment={equipment}
            staffing={staffing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};