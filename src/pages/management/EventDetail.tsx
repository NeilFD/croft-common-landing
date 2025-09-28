import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Users, Building, Plus, Edit, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateHoldDialog } from '@/components/management/CreateHoldDialog';
import { BookingsList } from '@/components/management/BookingsList';
import { EventNotesTab } from '@/components/management/EventNotesTab';
import { LateCloseTab } from '@/components/management/LateCloseTab';
import { EditEventDialog } from '@/components/management/EditEventDialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateHold, setShowCreateHold] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['management-event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event ID is required');
      
      const { data, error } = await supabase
        .from('management_events')
        .select(`
          *,
          bookings:bookings(
            *,
            space:spaces(name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
      case 'active': return 'bg-[hsl(var(--accent-green))] text-white';
      case 'closed': return 'bg-[hsl(var(--accent-blue))] text-white';
      case 'lost': return 'bg-[hsl(var(--destructive))] text-white';
      default: return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;

    try {
      const { error } = await supabase.rpc('update_management_event', {
        p_id: id,
        patch: { status: newStatus }
      });

      if (error) throw error;

      toast.success('Event status updated');
      queryClient.invalidateQueries({ queryKey: ['management-event', id] });
    } catch (error: any) {
      console.error('Error updating event status:', error);
      toast.error(error.message || 'Failed to update event status');
    }
  };

  if (isLoading || !event) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-industrial">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/management/events')}
            className="font-industrial p-0 h-auto text-muted-foreground hover:text-primary"
          >
            Events
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span>{event.code}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/management/events')}
              className="font-brutalist uppercase tracking-wide border-industrial"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK
            </Button>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">
                  {event.code}
                </h1>
                <Badge className={`font-industrial text-xs uppercase ${getStatusColor(event.status)}`}>
                  {event.status}
                </Badge>
              </div>
              
              {event.event_type && (
                <p className="font-industrial text-muted-foreground text-sm md:text-base">
                  {event.event_type}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowEditEvent(true)}
                    variant="outline"
                    className="font-brutalist uppercase tracking-wide border-industrial"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    EDIT EVENT
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Modify event details such as name, type, dates, and other event information</p>
                </TooltipContent>
              </Tooltip>
              
              {event.status === 'draft' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStatusUpdate('active')}
                      variant="outline"
                      className="font-brutalist uppercase tracking-wide border-industrial"
                    >
                      ACTIVATE
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Change event status from draft to active. This confirms the event and makes it visible to operations teams</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowCreateHold(true)}
                    className="btn-primary font-brutalist uppercase tracking-wide h-10 md:h-11"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    ADD SPACE BOOKING
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Create a new space booking for this event. Each booking reserves a specific time slot in a venue space</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          {event.primary_date && (
            <Card className="border-industrial">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  <div>
                    <p className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                      Primary Date
                    </p>
                    <p className="font-brutalist text-lg font-black">
                      {format(new Date(event.primary_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {event.headcount && (
            <Card className="border-industrial">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  <div>
                    <p className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                      Headcount
                    </p>
                    <p className="font-brutalist text-lg font-black">
                      {event.headcount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-industrial">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  <div>
                    <p className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                      Space Bookings
                    </p>
                    <p className="font-brutalist text-lg font-black">
                      {event.bookings?.length || 0}
                    </p>
                    <p className="font-industrial text-xs text-muted-foreground mt-1">
                      {new Set(event.bookings?.map((b: any) => b.space?.name)).size || 0} unique spaces
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-[hsl(var(--muted))] border border-industrial">
            <TabsTrigger value="bookings" className="font-brutalist uppercase tracking-wide text-xs">
              SPACE BOOKINGS
            </TabsTrigger>
            <TabsTrigger value="overview" className="font-brutalist uppercase tracking-wide text-xs">
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="notes" className="font-brutalist uppercase tracking-wide text-xs">
              NOTES
            </TabsTrigger>
            <TabsTrigger value="late-close" className="font-brutalist uppercase tracking-wide text-xs">
              LATE CLOSE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg border border-industrial">
                <p className="font-industrial text-sm text-muted-foreground">
                  Each space booking represents a reserved time slot in a specific venue space. 
                  You can book multiple time slots and different spaces for the same event.
                </p>
              </div>
              <BookingsList eventId={id!} bookings={event.bookings || []} />
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Client Details Section */}
              {(event.client_name || event.client_email || event.client_phone || event.budget) && (
                <Card className="border-industrial">
                  <CardHeader>
                    <CardTitle className="font-brutalist uppercase tracking-wide">CLIENT DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
                      {event.client_name && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Client Name
                          </Label>
                          <p className="font-industrial">{event.client_name}</p>
                        </div>
                      )}
                      
                      {event.client_email && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Email Address
                          </Label>
                          <p className="font-industrial">
                            <a href={`mailto:${event.client_email}`} className="text-primary hover:underline">
                              {event.client_email}
                            </a>
                          </p>
                        </div>
                      )}
                      
                      {event.client_phone && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Phone Number
                          </Label>
                          <p className="font-industrial">
                            <a href={`tel:${event.client_phone}`} className="text-primary hover:underline">
                              {event.client_phone}
                            </a>
                          </p>
                        </div>
                      )}
                      
                      {event.budget && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Budget
                          </Label>
                          <p className="font-industrial">£{event.budget}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Information */}
              <Card className="border-industrial">
                <CardHeader>
                  <CardTitle className="font-brutalist uppercase tracking-wide">EVENT INFORMATION</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
                    <div>
                      <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                        Event Code
                      </Label>
                      <p className="font-brutalist text-lg">{event.code}</p>
                    </div>
                    
                    <div>
                      <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                        Status
                      </Label>
                      <Badge className={`font-industrial text-xs uppercase ${getStatusColor(event.status)} mt-1`}>
                        {event.status}
                      </Badge>
                    </div>

                    {event.event_type && (
                      <div>
                        <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                          Event Type
                        </Label>
                        <p className="font-industrial">{event.event_type}</p>
                      </div>
                    )}

                    {event.headcount && (
                      <div>
                        <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                          Expected Headcount
                        </Label>
                        <p className="font-industrial">{event.headcount}</p>
                      </div>
                    )}

                    {(event as any).start_date && (
                      <div>
                        <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                          Event Date
                        </Label>
                        <p className="font-industrial">{format(new Date((event as any).start_date), 'dd MMM yyyy')}</p>
                      </div>
                    )}

                    {(event as any).start_time && (
                      <div>
                        <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                          Start Time
                        </Label>
                        <p className="font-industrial">{(event as any).start_time}</p>
                      </div>
                    )}

                    <div>
                      <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                        Created
                      </Label>
                      <p className="font-industrial">{format(new Date(event.created_at), 'dd MMM yyyy HH:mm')}</p>
                    </div>

                    <div>
                      <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                        Last Updated
                      </Label>
                      <p className="font-industrial">{format(new Date(event.updated_at), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <EventNotesTab eventId={id!} notes={event.notes} />
          </TabsContent>

          <TabsContent value="late-close">
            <LateCloseTab event={event} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateHoldDialog
        eventId={id!}
        open={showCreateHold}
        onOpenChange={setShowCreateHold}
      />
      
      <EditEventDialog
        eventId={id!}
        event={event}
        open={showEditEvent}
        onOpenChange={setShowEditEvent}
      />
    </ManagementLayout>
  );
};

export default EventDetail;