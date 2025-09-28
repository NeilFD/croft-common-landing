import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Calendar, Users, Building, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CreateEventDialog } from '@/components/management/CreateEventDialog';

const EventsList = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showResults, setShowResults] = useState(false);

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

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = !searchTerm || 
      event.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSearch = () => {
    setShowResults(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShowResults(false);
  };

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
      <div className="space-y-4 md:space-y-6 p-3 md:p-6 overflow-x-hidden">
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

        {/* Search and Filter Section */}
        <Card className="border-industrial">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-industrial w-full"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 font-industrial">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button 
                      onClick={handleSearch}
                      className="btn-primary font-brutalist uppercase tracking-wide w-full sm:w-auto"
                    >
                      SEARCH
                    </Button>
                    
                    {showResults && (
                      <Button 
                        variant="outline" 
                        onClick={handleClearSearch}
                        className="font-brutalist uppercase tracking-wide border-industrial w-full sm:w-auto"
                      >
                        CLEAR
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {!showResults && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-brutalist text-lg font-black uppercase tracking-wide mb-2">
                    SEARCH FOR EVENTS
                  </h3>
                  <p className="font-industrial text-muted-foreground">
                    Use the search and filter options above to find events
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid gap-4 md:gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="border-industrial hover:shadow-brutal transition-all">
                    <CardHeader className="pb-3 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="space-y-1">
                              <CardTitle className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wide">
                                {event.event_type || 'Event'}
                              </CardTitle>
                              {event.client_name && (
                                <p className="font-industrial text-base md:text-lg text-[hsl(var(--foreground))] font-medium">
                                  {event.client_name}
                                </p>
                              )}
                              <p className="font-industrial text-sm text-muted-foreground">
                                {event.code}
                              </p>
                            </div>
                            <Badge className={`font-industrial text-xs uppercase ${getStatusColor(event.status)} ml-4`}>
                              {event.status}
                            </Badge>
                          </div>
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
                        
                        {(event.client_email || event.client_phone) && (
                          <div className="flex gap-2 text-xs text-muted-foreground mr-4">
                            {event.client_email && (
                              <a href={`mailto:${event.client_email}`} className="text-primary hover:underline font-industrial">
                                {event.client_email}
                              </a>
                            )}
                            {event.client_phone && (
                              <>
                                {event.client_email && <span>•</span>}
                                <a href={`tel:${event.client_phone}`} className="text-primary hover:underline font-industrial">
                                  {event.client_phone}
                                </a>
                              </>
                            )}
                          </div>
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
              </div>
            ) : (
              <Card className="border-industrial">
                <CardContent className="p-8 md:p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-brutalist text-lg font-black uppercase tracking-wide mb-2">
                    NO EVENTS FOUND
                  </h3>
                  <p className="font-industrial text-muted-foreground mb-4">
                    Try adjusting your search criteria or create a new event
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
        )}
      </div>

      <CreateEventDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </ManagementLayout>
  );
};

export default EventsList;