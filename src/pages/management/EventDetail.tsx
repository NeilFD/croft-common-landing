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
import { ArrowLeft, Calendar, Users, Building, Plus, Edit, ChevronRight, Eye, FileText, FileCheck, Receipt, StickyNote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateHoldDialog } from '@/components/management/CreateHoldDialog';
import { BookingsList } from '@/components/management/BookingsList';
import { EventNotesTab } from '@/components/management/EventNotesTab';
import { LateCloseTab } from '@/components/management/LateCloseTab';
import { EditEventDialog } from '@/components/management/EditEventDialog';
import { EditContactDetailsDialog } from '@/components/management/EditContactDetailsDialog';
import { ProposalBuilder } from '@/components/management/ProposalBuilder';
import { ContractPreview } from '@/components/management/ContractPreview';
import { InvoiceManager } from '@/components/management/InvoiceManager';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BEOBuilder } from '@/components/management/beo/BEOBuilder';
import { BEOVersions } from '@/components/management/beo/BEOVersions';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateHold, setShowCreateHold] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showEditContactDetails, setShowEditContactDetails] = useState(false);

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

  const { data: bookings } = useQuery({
    queryKey: ['event-bookings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, title, start_ts, end_ts, setup_min, teardown_min, status, space:spaces(name)')
        .eq('event_id', id);
      if (error) throw error;
      return data || [];
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

  // Fetch linked lead for fallback contact details
  const { data: linkedLead } = useQuery({
    queryKey: ['lead-for-event', event?.lead_id],
    queryFn: async () => {
      const leadId = event?.lead_id;
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .eq('id', leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!event?.lead_id
  });

  // Heuristic fallback: try match a lead by preferred_date and type when no explicit link exists
  const { data: derivedLead } = useQuery({
    queryKey: ['lead-derived', id, event?.primary_date, event?.event_type, event?.headcount],
    queryFn: async () => {
      if (!event) return null;
      let query = supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .eq('preferred_date', event.primary_date)
        .eq('event_type', event.event_type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await query;
      if (error) return null; // silent fallback
      return data;
    },
    enabled: !!event && !event.client_email && !!event.primary_date && !!event.event_type
  });

  const clientName = event?.client_name ?? (linkedLead ? `${linkedLead.first_name} ${linkedLead.last_name}` : (derivedLead ? `${derivedLead.first_name} ${derivedLead.last_name}` : null));
  const clientEmail = event?.client_email ?? linkedLead?.email ?? derivedLead?.email ?? null;
  const clientPhone = event?.client_phone ?? linkedLead?.phone ?? derivedLead?.phone ?? null;

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
                <div className="space-y-1">
                  <h1 className="font-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">
                    {event.event_type || 'Event'}
                  </h1>
                  {clientName && (
                    <p className="font-industrial text-lg md:text-xl text-[hsl(var(--foreground))] font-medium">
                      {clientName}
                    </p>
                  )}
                  <p className="font-industrial text-sm md:text-base text-muted-foreground">
                    {event.code}
                  </p>
                </div>
                <Badge className={`font-industrial text-xs uppercase ${getStatusColor(event.status)} ml-4`}>
                  {event.status}
                </Badge>
              </div>

              {(clientEmail || clientPhone) && (
                <div className="mt-3 space-y-1">
                  <div className="space-x-2 font-industrial text-xs md:text-sm">
                    {clientEmail && (
                      <a href={`mailto:${clientEmail}`} className="text-primary hover:underline">{clientEmail}</a>
                    )}
                    {clientPhone && (
                      <>
                        {clientEmail && <span className="text-muted-foreground">•</span>}
                        <a href={`tel:${clientPhone}`} className="text-primary hover:underline">{clientPhone}</a>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-industrial">
                    {event?.client_name || event?.client_email || event?.client_phone ? 
                      'Event-specific contact details' : 
                      linkedLead ? 'Contact details from linked lead' : 
                      derivedLead ? 'Contact details from matched lead' : 
                      'No contact details available'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowEditContactDetails(true)}
                    variant="outline"
                    size="sm"
                    className="font-brutalist uppercase tracking-wide border-industrial text-xs"
                  >
                    EDIT CONTACT
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit client contact details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
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
                      {bookings?.length || 0}
                    </p>
                    <p className="font-industrial text-xs text-muted-foreground mt-1">
                      {new Set((bookings ?? []).map((b: any) => b.space?.name)).size || 0} unique spaces
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8 bg-[hsl(var(--muted))] border border-industrial">
            <TabsTrigger value="bookings" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">BOOKINGS</span>
              <span className="md:hidden">BOOK</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <Eye className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">OVERVIEW</span>
              <span className="md:hidden">VIEW</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <FileText className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">PROPOSALS</span>
              <span className="md:hidden">PROP</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <FileCheck className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">CONTRACTS</span>
              <span className="md:hidden">CONT</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <Receipt className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">INVOICES</span>
              <span className="md:hidden">INV</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <StickyNote className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">NOTES</span>
              <span className="md:hidden">NOTE</span>
            </TabsTrigger>
            <TabsTrigger value="late-close" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">LATE CLOSE</span>
              <span className="md:hidden">LATE</span>
            </TabsTrigger>
            <TabsTrigger value="beo" className="font-brutalist uppercase tracking-wide text-xs flex items-center justify-center gap-1">
              <FileText className="h-3 w-3 md:hidden" />
              <span className="hidden md:inline">BEO</span>
              <span className="md:hidden">BEO</span>
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
              <BookingsList eventId={id!} bookings={bookings || []} />
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Client Details Section */}
              {(clientName || clientEmail || clientPhone || event.budget) && (
                <Card className="border-industrial">
                  <CardHeader>
                    <CardTitle className="font-brutalist uppercase tracking-wide">CLIENT DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
                      {clientName && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Client Name
                          </Label>
                          <p className="font-industrial">{clientName}</p>
                        </div>
                      )}
                      
                      {clientEmail && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Email Address
                          </Label>
                          <p className="font-industrial">
                            <a href={`mailto:${clientEmail}`} className="text-primary hover:underline">
                              {clientEmail}
                            </a>
                          </p>
                        </div>
                      )}
                      
                      {clientPhone && (
                        <div>
                          <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                            Phone Number
                          </Label>
                          <p className="font-industrial">
                            <a href={`tel:${clientPhone}`} className="text-primary hover:underline">
                              {clientPhone}
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

                    {event.primary_date && (
                      <div>
                        <Label className="font-industrial text-xs uppercase tracking-wide text-muted-foreground">
                          Event Date
                        </Label>
                        <p className="font-industrial">{format(new Date(event.primary_date), 'dd MMM yyyy')}</p>
                      </div>
                    )}

                    {/* No explicit start time stored for management events yet */}

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

          <TabsContent value="proposals">
            <ProposalBuilder eventId={id!} headcount={event?.headcount} />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractPreview eventId={id!} />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceManager eventId={id!} />
          </TabsContent>

          <TabsContent value="notes">
            <EventNotesTab eventId={id!} notes={event.notes} />
          </TabsContent>

          <TabsContent value="late-close">
            <LateCloseTab event={event} />
          </TabsContent>

          <TabsContent value="beo">
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg border border-industrial">
                <p className="font-industrial text-sm text-muted-foreground">
                  The Banquet Event Order (BEO) is a comprehensive document that outlines all operational details 
                  for your event including menu, staffing, schedule, room layouts, and equipment requirements.
                </p>
              </div>
              
              <Tabs defaultValue="builder" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--muted))]">
                  <TabsTrigger value="builder" className="font-brutalist uppercase tracking-wide text-xs">
                    BEO Builder
                  </TabsTrigger>
                  <TabsTrigger value="versions" className="font-brutalist uppercase tracking-wide text-xs">
                    Generated Versions
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="builder">
                  <BEOBuilder 
                    eventId={id!} 
                    eventData={event}
                  />
                </TabsContent>
                
                <TabsContent value="versions">
                  <BEOVersions eventId={id!} />
                </TabsContent>
              </Tabs>
            </div>
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
        
        <EditContactDetailsDialog
          eventId={id!}
          event={event}
          open={showEditContactDetails}
          onOpenChange={setShowEditContactDetails}
        />
    </ManagementLayout>
  );
};

export default EventDetail;