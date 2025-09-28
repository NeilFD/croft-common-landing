import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceManager } from '@/components/management/InvoiceManager';

const EventInvoices = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['management-event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event ID is required');
      
      const { data, error } = await supabase
        .from('management_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/management/events/${id}`)}
            className="font-industrial p-0 h-auto text-muted-foreground hover:text-primary"
          >
            {event.code}
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span>Invoices</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/management/events/${id}`)}
              className="font-brutalist uppercase tracking-wide border-industrial"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK TO EVENT
            </Button>
            
            <div>
              <h1 className="font-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">
                INVOICES
              </h1>
              <p className="font-industrial text-lg text-muted-foreground">
                {event.event_type} - {event.code}
              </p>
            </div>
          </div>
        </div>

        <InvoiceManager eventId={id!} />
      </div>
    </ManagementLayout>
  );
};

export default EventInvoices;