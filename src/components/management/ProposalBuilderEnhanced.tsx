import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Utensils, CheckCircle2, FileText } from 'lucide-react';
import { useCurrentProposal, useProposalVersions } from '@/hooks/useProposalData';
import { format } from 'date-fns';
import { ProposalBuilder as LegacyProposalBuilder } from './ProposalBuilder';

interface ProposalBuilderEnhancedProps {
  eventId: string;
  headcount?: number;
}

export const ProposalBuilderEnhanced: React.FC<ProposalBuilderEnhancedProps> = ({ eventId, headcount = 1 }) => {
  const { data: currentProposal } = useCurrentProposal(eventId);
  const { data: proposalVersions } = useProposalVersions(eventId);

  // If no BEO-generated proposal exists, show legacy builder
  if (!currentProposal?.content_snapshot) {
    return (
      <div className="space-y-4">
        <Card className="border-industrial bg-muted/30">
          <CardContent className="py-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-industrial font-bold mb-2">No BEO Generated Yet</h3>
            <p className="text-sm text-muted-foreground">
              Generate a BEO first to automatically populate the proposal with event details.
            </p>
          </CardContent>
        </Card>
        <LegacyProposalBuilder eventId={eventId} headcount={headcount} />
      </div>
    );
  }

  const snapshot = currentProposal.content_snapshot;

  return (
    <div className="space-y-6">
      {/* Proposal Status Banner */}
      <Card className="border-industrial bg-accent/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent-pink" />
              <div>
                <p className="font-industrial text-sm">
                  <span className="font-bold">Proposal Version {currentProposal.version_no}</span>
                  {' '}- Last updated {format(new Date(currentProposal.generated_at), 'PPp')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <Badge variant={currentProposal.status === 'approved' ? 'default' : 'secondary'}>{currentProposal.status.toUpperCase()}</Badge>
                  {proposalVersions && proposalVersions.length > 1 && (
                    <span className="ml-2">({proposalVersions.length} versions total)</span>
                  )}
                </p>
              </div>
            </div>
            {currentProposal.status === 'draft' && (
              <Badge variant="outline" className="font-industrial">Auto-populated from BEO</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* BEO-Generated Proposal Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Event Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="border-industrial">
            <CardHeader>
              <CardTitle className="font-brutalist text-lg uppercase tracking-wide">Event Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Event Name</Label>
                  <p className="font-industrial">{snapshot.eventOverview?.eventName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Event Date</Label>
                  <p className="font-industrial">
                    {snapshot.eventOverview?.eventDate ? format(new Date(snapshot.eventOverview.eventDate), 'PPP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Headcount</Label>
                  <p className="font-industrial">{snapshot.eventOverview?.headcount || 'N/A'} guests</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <p className="font-industrial">{snapshot.eventOverview?.clientName || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card className="border-industrial">
            <CardHeader>
              <CardTitle className="font-brutalist text-lg uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Room Setup & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.setup?.spaces?.map((space: any, idx: number) => (
                <div key={idx} className="border-l-2 border-accent-pink pl-4 py-2">
                  <h4 className="font-industrial font-bold">{space.space_name}</h4>
                  <p className="text-sm text-muted-foreground">Layout: {space.layout_type}</p>
                  {space.capacity && <p className="text-sm">Capacity: {space.capacity} people</p>}
                  {space.setup_time && <p className="text-sm text-muted-foreground">Setup: {space.setup_time}</p>}
                  {space.setup_notes && <p className="text-sm mt-2">{space.setup_notes}</p>}
                </div>
              ))}
              {(!snapshot.setup?.spaces || snapshot.setup.spaces.length === 0) && (
                <p className="text-sm text-muted-foreground">No setup details available yet.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Equipment Section */}
          {snapshot.equipment && snapshot.equipment.length > 0 && (
            <Card className="border-industrial">
              <CardHeader>
                <CardTitle className="font-brutalist text-lg uppercase tracking-wide">Equipment & Tech</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.equipment.map((eq: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 border-l-2 border-muted pl-4 py-2">
                    <div className="flex-1">
                      <p className="font-industrial font-medium">{eq.item_name}</p>
                      <p className="text-xs text-muted-foreground">{eq.category} x {eq.quantity}</p>
                      {eq.specifications && <p className="text-sm text-muted-foreground mt-1">{eq.specifications}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-4">
          <Card className="border-industrial">
            <CardHeader>
              <CardTitle className="font-brutalist text-lg uppercase tracking-wide flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Menu & Catering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {snapshot.menu?.courses?.map((course: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-industrial font-bold text-accent-pink uppercase tracking-wide">{course.course}</h4>
                  <div className="space-y-2 pl-4">
                    {course.items?.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="border-l-2 border-muted pl-3">
                        <p className="font-industrial font-medium">{item.item_name}</p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="text-xs text-muted-foreground italic mt-1">Allergens: {item.allergens.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!snapshot.menu?.courses || snapshot.menu.courses.length === 0) && (
                <p className="text-sm text-muted-foreground">No menu details available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="border-industrial">
            <CardHeader>
              <CardTitle className="font-brutalist text-lg uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.timeline?.schedule?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 border-l-2 border-accent-pink pl-4 py-2">
                  <div className="flex-shrink-0 w-20">
                    <p className="font-industrial font-bold text-sm">{format(new Date(item.scheduled_at), 'HH:mm')}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-industrial font-medium">{item.time_label}</p>
                    {item.duration_minutes && <p className="text-xs text-muted-foreground">{item.duration_minutes} minutes</p>}
                    {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                  </div>
                </div>
              ))}
              {(!snapshot.timeline?.schedule || snapshot.timeline.schedule.length === 0) && (
                <p className="text-sm text-muted-foreground">No timeline details available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab - Use Legacy Proposal Builder */}
        <TabsContent value="pricing">
          <LegacyProposalBuilder eventId={eventId} headcount={headcount} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
