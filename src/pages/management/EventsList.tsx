import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Calendar, Users, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CreateEventDialog } from '@/components/management/CreateEventDialog';

const EventsList = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['management-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_events')
        .select(`
          *,
          bookings:bookings(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
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

  if (isLoading) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">EVENTS</h1>
            <p className="font-industrial text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage multi-space events and bookings
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="btn-primary font-brutalist uppercase tracking-wide h-10 md:h-11"
          >
            <Plus className="h-4 w-4 mr-2" />
            CREATE EVENT
          </Button>
        </div>

        <div className="grid gap-4 md:gap-6">
          {events?.map((event) => (
            <Card key={event.id} className="border-industrial hover:shadow-brutal transition-all">
              <CardHeader className="pb-3 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wide">
                        {event.code}
                      </CardTitle>
                      <Badge className={`font-industrial text-xs uppercase ${getStatusColor(event.status)}`}>
                        {event.status}
                      </Badge>
                    </div>
                    
                    {event.event_type && (
                      <CardDescription className="font-industrial text-sm md:text-base">
                        {event.event_type}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.primary_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-industrial">{format(new Date(event.primary_date), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                    
                    {event.headcount && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-industrial">{event.headcount}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span className="font-industrial">{event.bookings?.length || 0} spaces</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="flex justify-between items-center">
                  {event.notes && (
                    <p className="font-industrial text-sm text-muted-foreground line-clamp-2 flex-1 mr-4">
                      {event.notes}
                    </p>
                  )}
                  
                  <Button asChild variant="outline" className="font-brutalist uppercase tracking-wide border-industrial">
                    <Link to={`/management/events/${event.id}`}>
                      VIEW EVENT
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {events?.length === 0 && (
            <Card className="border-industrial">
              <CardContent className="p-8 md:p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-brutalist text-lg font-black uppercase tracking-wide mb-2">
                  NO EVENTS YET
                </h3>
                <p className="font-industrial text-muted-foreground mb-4">
                  Create your first event to start managing multi-space bookings
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="btn-primary font-brutalist uppercase tracking-wide"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  CREATE EVENT
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateEventDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </ManagementLayout>
  );
};

export default EventsList;