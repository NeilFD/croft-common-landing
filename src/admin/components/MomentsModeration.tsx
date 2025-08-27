import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle, Eye, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface MemberMoment {
  id: string;
  user_id: string;
  image_url: string;
  tagline: string;
  date_taken: string;
  uploaded_at: string;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  moderation_reason?: string;
  ai_confidence_score?: number;
  ai_flags?: any[];
  is_featured: boolean;
  is_visible: boolean;
  latitude?: number;
  longitude?: number;
  location_confirmed: boolean;
}

const MomentsModeration: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_review'>('pending');
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch moments based on filter
  const { data: moments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-moments', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('member_moments')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('moderation_status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MemberMoment[];
    },
  });

  // Moderation mutations
  const moderateMoment = useMutation({
    mutationFn: async ({ momentId, status, reason }: { momentId: string; status: 'approved' | 'rejected'; reason?: string }) => {
      const { error } = await supabase
        .from('member_moments')
        .update({
          moderation_status: status,
          moderation_reason: reason,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', momentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moments'] });
      setSelectedMoment(null);
      setRejectionReason('');
      toast({
        title: "Moment moderated",
        description: "The moment has been successfully moderated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to moderate moment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ momentId, featured }: { momentId: string; featured: boolean }) => {
      const { error } = await supabase
        .from('member_moments')
        .update({ is_featured: featured })
        .eq('id', momentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moments'] });
      toast({
        title: "Success",
        description: "Moment feature status updated.",
      });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ momentId, visible }: { momentId: string; visible: boolean }) => {
      const { error } = await supabase
        .from('member_moments')
        .update({ is_visible: visible })
        .eq('id', momentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moments'] });
      toast({
        title: "Success",
        description: "Moment visibility updated.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'needs_review':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />Needs Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (momentId: string) => {
    moderateMoment.mutate({ momentId, status: 'approved' });
  };

  const handleReject = (momentId: string, reason: string) => {
    moderateMoment.mutate({ momentId, status: 'rejected', reason });
  };

  const pendingCount = moments.filter(m => m.moderation_status === 'pending').length;
  const needsReviewCount = moments.filter(m => m.moderation_status === 'needs_review').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Moments Moderation</h2>
          <p className="text-muted-foreground">Review and moderate user-submitted moments</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {pendingCount} Pending
            </Badge>
          )}
          {needsReviewCount > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {needsReviewCount} Need Review
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({moments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({moments.filter(m => m.moderation_status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="needs_review">Need Review ({needsReviewCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({moments.filter(m => m.moderation_status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({moments.filter(m => m.moderation_status === 'rejected').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="aspect-square">
                  <div className="h-full bg-muted animate-pulse rounded-lg" />
                </Card>
              ))}
            </div>
          ) : moments.length === 0 ? (
            <Card className="p-8">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No moments found for this filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moments.map((moment) => (
                <Card key={moment.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <img
                      src={moment.image_url}
                      alt={moment.tagline}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(moment.moderation_status)}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {moment.is_featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                      {!moment.is_visible && (
                        <Badge variant="outline" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-2 right-2"
                      onClick={() => setSelectedMoment(moment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-medium line-clamp-2 mb-2">{moment.tagline}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <User className="h-3 w-3" />
                      <span>User {moment.user_id.slice(0, 8)}...</span>
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(moment.uploaded_at), 'MMM dd')}</span>
                    </div>

                    {moment.ai_confidence_score && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>AI Confidence</span>
                          <span>{Math.round(moment.ai_confidence_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-primary h-1 rounded-full" 
                            style={{ width: `${moment.ai_confidence_score * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {moment.moderation_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50 flex-1"
                          onClick={() => handleApprove(moment.id)}
                          disabled={moderateMoment.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                          onClick={() => setSelectedMoment(moment)}
                          disabled={moderateMoment.isPending}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={!!selectedMoment} onOpenChange={() => setSelectedMoment(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Moment Details</DialogTitle>
          </DialogHeader>
          
          {selectedMoment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedMoment.image_url}
                  alt={selectedMoment.tagline}
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedMoment.tagline}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedMoment.moderation_status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span>{format(new Date(selectedMoment.uploaded_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Taken:</span>
                      <span>{format(new Date(selectedMoment.date_taken), 'MMM dd, yyyy')}</span>
                    </div>
                    {selectedMoment.ai_confidence_score && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Confidence:</span>
                        <span>{Math.round(selectedMoment.ai_confidence_score * 100)}%</span>
                      </div>
                    )}
                    {selectedMoment.moderation_reason && (
                      <div>
                        <span className="text-muted-foreground">Reason:</span>
                        <p className="mt-1 text-sm bg-muted p-2 rounded">{selectedMoment.moderation_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={selectedMoment.is_featured ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFeatured.mutate({ momentId: selectedMoment.id, featured: !selectedMoment.is_featured })}
                    disabled={toggleFeatured.isPending}
                  >
                    {selectedMoment.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    variant={selectedMoment.is_visible ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleVisibility.mutate({ momentId: selectedMoment.id, visible: !selectedMoment.is_visible })}
                    disabled={toggleVisibility.isPending}
                  >
                    {selectedMoment.is_visible ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {selectedMoment.moderation_status === 'pending' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                        variant="outline"
                        onClick={() => handleApprove(selectedMoment.id)}
                        disabled={moderateMoment.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for rejection (optional)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button
                        className="w-full text-red-600 border-red-600 hover:bg-red-50"
                        variant="outline"
                        onClick={() => handleReject(selectedMoment.id, rejectionReason)}
                        disabled={moderateMoment.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MomentsModeration;