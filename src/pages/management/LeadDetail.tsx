import { useState } from 'react';
import { useParams, Navigate, useMatch } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  MapPin,
  MessageSquare,
  Plus,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLead, useLeadActivity, useUpdateLead, useAddLeadNote, useCreateLead, type CreateLeadPayload } from '@/hooks/useLeads';
import { useSpaces } from '@/hooks/useSpaces';
import { Link } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { ConvertToBookingButton } from '@/components/management/ConvertToBookingButton';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  qualified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  proposed: 'bg-purple-100 text-purple-800 border-purple-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const matchNew = useMatch('/management/spaces/leads/new');
  const isNewLead = !!matchNew || id === 'new';
  const [editing, setEditing] = useState(isNewLead);
  const [editForm, setEditForm] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    event_type: '',
    preferred_space: '',
    preferred_date: '',
    date_flexible: false,
    headcount: '',
    budget_low: '',
    budget_high: '',
    message: '',
  });
  const [newNote, setNewNote] = useState('');

  const { data: lead, isLoading } = useLead(isNewLead ? '' : id!);
  const { data: activity } = useLeadActivity(isNewLead ? '' : id!);
  const { data: spaces } = useSpaces();
  const updateLead = useUpdateLead();
  const addNote = useAddLeadNote();
  const createLead = useCreateLead();

  if (!id && !isNewLead) {
    return <Navigate to="/management/spaces/leads" replace />;
  }

  if (isLoading && !isNewLead) {
    return (
      <ManagementLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/management/spaces/leads">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading lead...</div>
            </CardContent>
          </Card>
        </div>
      </ManagementLayout>
    );
  }

  if (!lead && !isNewLead) {
    return (
      <ManagementLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/management/spaces/leads">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Lead not found</div>
            </CardContent>
          </Card>
        </div>
      </ManagementLayout>
    );
  }

  const handleEdit = () => {
    if (!isNewLead && lead) {
      setEditForm({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone || '',
        event_type: lead.event_type || '',
        preferred_space: lead.preferred_space || '',
        preferred_date: lead.preferred_date || '',
        date_flexible: lead.date_flexible,
        headcount: lead.headcount || '',
        budget_low: lead.budget_low || '',
        budget_high: lead.budget_high || '',
        message: lead.message || '',
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      if (isNewLead) {
        // Create new lead
        const payload: CreateLeadPayload = {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone || undefined,
          event_type: editForm.event_type || undefined,
          preferred_space: editForm.preferred_space,
          preferred_date: editForm.preferred_date || undefined,
          date_flexible: editForm.date_flexible,
          headcount: editForm.headcount ? parseInt(editForm.headcount) : undefined,
          budget_low: editForm.budget_low ? parseInt(editForm.budget_low) : undefined,
          budget_high: editForm.budget_high ? parseInt(editForm.budget_high) : undefined,
          message: editForm.message || undefined,
          source: 'management',
        };
        const newLeadId = await createLead.mutateAsync(payload);
        // Redirect to the newly created lead
        window.location.href = `/management/spaces/leads/${newLeadId}`;
      } else {
        // Update existing lead
        await updateLead.mutateAsync({
          leadId: lead!.id,
          patch: editForm,
        });
        setEditing(false);
      }
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleStatusChange = async (status: string) => {
    if (isNewLead || !lead) return; // Can't change status of new lead
    
    try {
      await updateLead.mutateAsync({
        leadId: lead.id,
        patch: { status } as any,
      });
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || isNewLead || !lead) return;
    
    try {
      await addNote.mutateAsync({
        leadId: lead.id,
        body: newNote.trim(),
      });
      setNewNote('');
    } catch (error) {
      // Error handled by the hook
    }
  };

  const formatBudget = (low?: number | null, high?: number | null) => {
    if (!low && !high) return 'Not specified';
    if (low && high) return `£${low.toLocaleString()} - £${high.toLocaleString()}`;
    if (low) return `£${low.toLocaleString()}+`;
    if (high) return `Up to £${high.toLocaleString()}`;
    return 'Not specified';
  };

  return (
    <ManagementLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/management/spaces/leads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewLead ? 'Create New Lead' : `${lead!.first_name} ${lead!.last_name}`}
            </h1>
            <p className="text-muted-foreground">
              {isNewLead ? 'Add a new lead to the system' : lead!.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNewLead && lead && (
            <Select value={lead.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {editing ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={updateLead.isPending || createLead.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {isNewLead ? 'Create Lead' : 'Save'}
              </Button>
              {!isNewLead && (
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className={isNewLead ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
        {/* Main Content */}
        <div className={isNewLead ? "" : "lg:col-span-2 space-y-6"}>
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Information</CardTitle>
                {!isNewLead && lead && (
                  <Badge variant="outline" className={STATUS_COLORS[lead.status]}>
                    {lead.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={editForm.first_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={editForm.last_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
              ) : lead && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.first_name} {lead.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type</Label>
                    <Input
                      value={editForm.event_type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, event_type: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Preferred Space</Label>
                    <Select 
                      value={editForm.preferred_space}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, preferred_space: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select space" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces?.map((space) => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preferred Date</Label>
                    <Input
                      type="date"
                      value={editForm.preferred_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Headcount</Label>
                    <Input
                      type="number"
                      value={editForm.headcount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, headcount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Budget Low (£)</Label>
                    <Input
                      type="number"
                      value={editForm.budget_low}
                      onChange={(e) => setEditForm(prev => ({ ...prev, budget_low: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Budget High (£)</Label>
                    <Input
                      type="number"
                      value={editForm.budget_high}
                      onChange={(e) => setEditForm(prev => ({ ...prev, budget_high: e.target.value }))}
                    />
                  </div>
                </div>
              ) : lead && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.event_type && (
                    <div>
                      <Label className="text-sm font-medium">Event Type</Label>
                      <p>{lead.event_type}</p>
                    </div>
                  )}
                  
                  {lead.space && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.space.name}</span>
                    </div>
                  )}
                  
                  {(lead.preferred_date || lead.date_flexible) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {lead.preferred_date 
                          ? format(new Date(lead.preferred_date), 'dd MMM yyyy')
                          : 'Flexible dates'
                        }
                      </span>
                    </div>
                  )}
                  
                  {lead.headcount && (
                    <div>
                      <Label className="text-sm font-medium">Headcount</Label>
                      <p>{lead.headcount} guests</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium">Budget</Label>
                    <p>{formatBudget(lead.budget_low, lead.budget_high)}</p>
                  </div>
                </div>
              )}
              
              {((lead && lead.message) || editing) && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Message</Label>
                    {editing ? (
                      <Textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Additional details about the event..."
                        className="mt-2"
                      />
                    ) : lead && (
                      <p className="mt-1 whitespace-pre-wrap">{lead.message}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions - only show for existing leads */}
          {!isNewLead && lead && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                {lead.phone && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
                <ConvertToBookingButton 
                  leadId={lead.id} 
                  leadTitle={`${lead.event_type || 'Event'} - ${lead.first_name} ${lead.last_name}`}
                />
              </CardContent>
            </Card>
          )}

          {/* Add Note - only show for existing leads */}
          {!isNewLead && lead && (
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add a note about this lead..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim() || addNote.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline - only show for existing leads */}
          {!isNewLead && lead && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity?.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {item.type === 'note' ? (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        ) : item.type === 'status' ? (
                          <Activity className="h-4 w-4 text-green-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {item.type === 'note' && item.body}
                          {item.type === 'status' && (
                            <span>
                              Status changed from {item.meta?.old_status} to {item.meta?.new_status}
                            </span>
                          )}
                          {item.type === 'system' && (
                            <span>{item.body}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!activity || activity.length === 0) && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No activity yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Details - only show for existing leads */}
          {!isNewLead && lead && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(lead.created_at), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(lead.updated_at), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span>{lead.source || 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      </div>
    </ManagementLayout>
  );
}