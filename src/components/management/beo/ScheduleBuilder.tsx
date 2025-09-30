import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock, Calendar, Pencil } from 'lucide-react';
import { EventSchedule, useBEOMutations } from '@/hooks/useBEOData';
import { format, parseISO } from 'date-fns';
import { utcToLocalDate } from '@/lib/timezone-utils';

interface ScheduleBuilderProps {
  eventId: string;
  schedule: EventSchedule[];
  eventData: any;
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({ 
  eventId, 
  schedule, 
  eventData 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    time_label: '',
    scheduled_date: eventData?.date || '',
    scheduled_time: '',
    duration_minutes: '',
    responsible_role: '',
    notes: ''
  });

  const { addScheduleItem, deleteScheduleItem, updateScheduleItem } = useBEOMutations(eventId);

  const eventTimeLabels = [
    'Setup Start',
    'Vendor Arrival',
    'Guest Arrival',
    'Reception Start',
    'Drinks Service',
    'Seating',
    'Welcome Speech',
    'Starter Service',
    'Main Course Service',
    'Dessert Service',
    'Coffee Service',
    'Entertainment Start',
    'Music Start',
    'Dancing',
    'Bar Last Orders',
    'Event End',
    'Cleanup Start',
    'Vendor Departure'
  ];

  const staffingRoles = [
    'Manager',
    'FOH',
    'Bar',
    'Kitchen',
    'Security',
    'Host',
    'Event Coordinator'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledAt = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
    
    const scheduleData = {
      time_label: formData.time_label,
      scheduled_at: scheduledAt,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
      responsible_role: formData.responsible_role || undefined,
      notes: formData.notes || undefined
    };

    if (editingId) {
      updateScheduleItem.mutate({ id: editingId, ...scheduleData }, {
        onSuccess: () => {
          setFormData({
            time_label: '',
            scheduled_date: eventData?.date || '',
            scheduled_time: '',
            duration_minutes: '',
            responsible_role: '',
            notes: ''
          });
          setEditingId(null);
          setShowAddForm(false);
        }
      });
    } else {
      addScheduleItem.mutate(scheduleData, {
        onSuccess: () => {
          setFormData({
            time_label: '',
            scheduled_date: eventData?.date || '',
            scheduled_time: '',
            duration_minutes: '',
            responsible_role: '',
            notes: ''
          });
          setShowAddForm(false);
        }
      });
    }
  };

  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Schedule Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event Timeline
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {eventData?.date && format(parseISO(eventData.date), 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedSchedule.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="font-['Work_Sans'] font-medium text-lg">
                    {format(utcToLocalDate(item.scheduled_at), 'HH:mm')}
                  </div>
                  {item.duration_minutes && (
                    <div className="text-xs text-muted-foreground">
                      {item.duration_minutes}min
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-['Work_Sans'] font-medium">{item.time_label}</h4>
                    {item.responsible_role && (
                      <Badge variant="outline">{item.responsible_role}</Badge>
                    )}
                  </div>
                  
                  {item.notes && (
                    <p className="text-sm text-muted-foreground">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id);
                      const localDate = utcToLocalDate(item.scheduled_at);
                      setFormData({
                        time_label: item.time_label,
                        scheduled_date: format(localDate, 'yyyy-MM-dd'),
                        scheduled_time: format(localDate, 'HH:mm'),
                        duration_minutes: item.duration_minutes?.toString() || '',
                        responsible_role: item.responsible_role || '',
                        notes: item.notes || ''
                      });
                      setShowAddForm(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteScheduleItem.mutate(item.id)}
                    disabled={deleteScheduleItem.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {sortedSchedule.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No schedule items added yet. Click "Add Schedule Item" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Schedule Item */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">
              {editingId ? 'Edit Schedule Item' : 'Add Schedule Item'}
            </CardTitle>
            <Button
              onClick={() => {
                if (!showAddForm) {
                  setEditingId(null);
                  setFormData({
                    time_label: '',
                    scheduled_date: eventData?.date || '',
                    scheduled_time: '',
                    duration_minutes: '',
                    responsible_role: '',
                    notes: ''
                  });
                }
                setShowAddForm(!showAddForm);
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Cancel Edit' : 'Add Schedule Item'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_label">Event Label</Label>
                  <Select
                    value={formData.time_label}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, time_label: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event label" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTimeLabels.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="responsible_role">Responsible Role</Label>
                  <Select
                    value={formData.responsible_role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select responsible role" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffingRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addScheduleItem.isPending || updateScheduleItem.isPending}
                >
                  {editingId ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};