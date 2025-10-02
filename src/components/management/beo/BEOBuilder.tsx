import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader, Plus, FileText, AlertCircle } from 'lucide-react';
import { useEventMenus, useEventStaffing, useEventSchedule, useEventRoomLayouts, useEventEquipment, useEventVenueHire, useBEOMutations } from '@/hooks/useBEOData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VenueBuilder } from './VenueBuilder';
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
  const [activeTab, setActiveTab] = useState("venue");

  // Validate that the event exists in the management_events table
  const { data: eventExists, isLoading: eventCheckLoading } = useQuery({
    queryKey: ['event-exists', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_events')
        .select('id')
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    }
  });

  const { data: venueHire, isLoading: venueLoading } = useEventVenueHire(eventId);
  const { data: menus = [], isLoading: menusLoading } = useEventMenus(eventId);
  const { data: staffing = [], isLoading: staffingLoading } = useEventStaffing(eventId);
  const { data: schedule = [], isLoading: scheduleLoading } = useEventSchedule(eventId);
  const { data: layouts = [], isLoading: layoutsLoading } = useEventRoomLayouts(eventId);
  const { data: equipment = [], isLoading: equipmentLoading } = useEventEquipment(eventId);

  const { generateBEO } = useBEOMutations(eventId);

  const isLoading = eventCheckLoading || venueLoading || menusLoading || staffingLoading || scheduleLoading || layoutsLoading || equipmentLoading;

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

  // Show error if event doesn't exist
  if (!eventCheckLoading && eventExists === false) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Event Not Found</AlertTitle>
          <AlertDescription>
            The event with ID {eventId} does not exist in the database. Please check the URL or contact support if you believe this is an error.
          </AlertDescription>
        </Alert>
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="venue" className="font-['Work_Sans']">Venue</TabsTrigger>
          <TabsTrigger value="menu" className="font-['Work_Sans']">Menu</TabsTrigger>
          <TabsTrigger value="staffing" className="font-['Work_Sans']">Staff</TabsTrigger>
          <TabsTrigger value="schedule" className="font-['Work_Sans']">Time</TabsTrigger>
          <TabsTrigger value="layout" className="font-['Work_Sans']">Room</TabsTrigger>
          <TabsTrigger value="equipment" className="font-['Work_Sans']">Kit</TabsTrigger>
          <TabsTrigger value="contacts" className="font-['Work_Sans']">People</TabsTrigger>
          <TabsTrigger value="costs" className="font-['Work_Sans']">£</TabsTrigger>
        </TabsList>

        <TabsContent value="venue" className="space-y-4">
          <VenueBuilder eventId={eventId} venueHire={venueHire} />
        </TabsContent>

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
            menus={menus}
            venueHire={venueHire}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
