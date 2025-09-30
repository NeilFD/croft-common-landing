import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layout, Pencil } from 'lucide-react';
import { EventRoomLayout, useBEOMutations } from '@/hooks/useBEOData';
import { format, parseISO } from 'date-fns';

interface RoomLayoutBuilderProps {
  eventId: string;
  layouts: EventRoomLayout[];
}

export const RoomLayoutBuilder: React.FC<RoomLayoutBuilderProps> = ({ eventId, layouts }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    space_name: '',
    layout_type: '',
    capacity: '',
    setup_notes: '',
    setup_time: '',
    breakdown_time: '',
    special_requirements: ''
  });

  const { addRoomLayout, deleteRoomLayout, updateRoomLayout } = useBEOMutations(eventId);

  const spaceOptions = [
    'Main Hall',
    'Hideout',
    'Roof Terrace',
    'Reception Area',
    'Bar Area',
    'Kitchen',
    'Storage Room',
    'Entrance',
    'Courtyard'
  ];

  const layoutTypes = [
    'Theatre',
    'Boardroom',
    'Cabaret',
    'Reception',
    'U-Shape',
    'Classroom',
    'Banquet',
    'Cocktail',
    'Standing',
    'Mixed'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const layoutData = {
      space_name: formData.space_name,
      layout_type: formData.layout_type,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      setup_notes: formData.setup_notes || undefined,
      setup_time: formData.setup_time || undefined,
      breakdown_time: formData.breakdown_time || undefined,
      special_requirements: formData.special_requirements || undefined
    };
    
    if (editingId) {
      updateRoomLayout.mutate({ id: editingId, ...layoutData }, {
        onSuccess: () => {
          setFormData({
            space_name: '',
            layout_type: '',
            capacity: '',
            setup_notes: '',
            setup_time: '',
            breakdown_time: '',
            special_requirements: ''
          });
          setEditingId(null);
          setShowAddForm(false);
        }
      });
    } else {
      addRoomLayout.mutate(layoutData, {
        onSuccess: () => {
          setFormData({
            space_name: '',
            layout_type: '',
            capacity: '',
            setup_notes: '',
            setup_time: '',
            breakdown_time: '',
            special_requirements: ''
          });
          setShowAddForm(false);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Room Layouts List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Room Layouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {layouts.map((layout) => (
              <div key={layout.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-['Work_Sans'] font-medium text-lg">{layout.space_name}</h4>
                      <Badge variant="secondary">{layout.layout_type}</Badge>
                      {layout.capacity && (
                        <Badge variant="outline">{layout.capacity} guests</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingId(layout.id);
                        setFormData({
                          space_name: layout.space_name,
                          layout_type: layout.layout_type,
                          capacity: layout.capacity?.toString() || '',
                          setup_notes: layout.setup_notes || '',
                          setup_time: layout.setup_time || '',
                          breakdown_time: layout.breakdown_time || '',
                          special_requirements: layout.special_requirements || ''
                        });
                        setShowAddForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteRoomLayout.mutate(layout.id)}
                      disabled={deleteRoomLayout.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {(layout.setup_time || layout.breakdown_time) && (
                    <div>
                      <div className="font-['Work_Sans'] font-medium mb-1">Setup Times</div>
                      <div className="text-muted-foreground">
                        Setup: {layout.setup_time ? format(parseISO(layout.setup_time), 'HH:mm dd/MM') : 'TBC'}
                        <br />
                        Breakdown: {layout.breakdown_time ? format(parseISO(layout.breakdown_time), 'HH:mm dd/MM') : 'TBC'}
                      </div>
                    </div>
                  )}

                  {layout.setup_notes && (
                    <div>
                      <div className="font-['Work_Sans'] font-medium mb-1">Setup Notes</div>
                      <div className="text-muted-foreground">{layout.setup_notes}</div>
                    </div>
                  )}
                </div>

                {layout.special_requirements && (
                  <div className="mt-3 p-2 bg-muted rounded">
                    <div className="font-['Work_Sans'] font-medium text-sm mb-1">Special Requirements</div>
                    <div className="text-sm text-muted-foreground">{layout.special_requirements}</div>
                  </div>
                )}
              </div>
            ))}

            {layouts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No room layouts configured yet. Click "Add Room Layout" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Room Layout */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">
              {editingId ? 'Edit Room Layout' : 'Add Room Layout'}
            </CardTitle>
            <Button
              onClick={() => {
                if (!showAddForm) {
                  setEditingId(null);
                  setFormData({
                    space_name: '',
                    layout_type: '',
                    capacity: '',
                    setup_notes: '',
                    setup_time: '',
                    breakdown_time: '',
                    special_requirements: ''
                  });
                }
                setShowAddForm(!showAddForm);
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Cancel Edit' : 'Add Room Layout'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="space_name">Space Name</Label>
                  <Select
                    value={formData.space_name}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, space_name: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceOptions.map((space) => (
                        <SelectItem key={space} value={space}>
                          {space}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="layout_type">Layout Type</Label>
                  <Select
                    value={formData.layout_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, layout_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {layoutTypes.map((layout) => (
                        <SelectItem key={layout} value={layout}>
                          {layout}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="setup_time">Setup Time</Label>
                  <Input
                    id="setup_time"
                    type="datetime-local"
                    value={formData.setup_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, setup_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="breakdown_time">Breakdown Time</Label>
                  <Input
                    id="breakdown_time"
                    type="datetime-local"
                    value={formData.breakdown_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, breakdown_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="setup_notes">Setup Notes</Label>
                <Textarea
                  id="setup_notes"
                  value={formData.setup_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, setup_notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
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
                  disabled={addRoomLayout.isPending || updateRoomLayout.isPending}
                >
                  {editingId ? 'Update Layout' : 'Add Layout'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};