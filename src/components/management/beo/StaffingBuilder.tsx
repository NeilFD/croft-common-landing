import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Pencil } from 'lucide-react';
import { EventStaffing, useBEOMutations } from '@/hooks/useBEOData';

interface StaffingBuilderProps {
  eventId: string;
  staffing: EventStaffing[];
}

export const StaffingBuilder: React.FC<StaffingBuilderProps> = ({ eventId, staffing }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role: '',
    qty: '1',
    shift_start: '',
    shift_end: '',
    hourly_rate: '',
    notes: ''
  });

  const { addStaffingRequirement, deleteStaffingRequirement, updateStaffingRequirement } = useBEOMutations(eventId);

  const staffingRoles = [
    'Manager',
    'FOH',
    'Bar',
    'Kitchen',
    'Security',
    'Host',
    'Waiter/Waitress',
    'Chef',
    'Bartender',
    'Cleaner',
    'Setup Crew',
    'Event Coordinator'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const staffingData = {
      role: formData.role,
      qty: parseInt(formData.qty),
      shift_start: formData.shift_start || undefined,
      shift_end: formData.shift_end || undefined,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      notes: formData.notes || undefined
    };
    
    if (editingId) {
      updateStaffingRequirement.mutate({ id: editingId, ...staffingData }, {
        onSuccess: () => {
          setFormData({
            role: '',
            qty: '1',
            shift_start: '',
            shift_end: '',
            hourly_rate: '',
            notes: ''
          });
          setEditingId(null);
          setShowAddForm(false);
        }
      });
    } else {
      addStaffingRequirement.mutate(staffingData, {
        onSuccess: () => {
          setFormData({
            role: '',
            qty: '1',
            shift_start: '',
            shift_end: '',
            hourly_rate: '',
            notes: ''
          });
          setShowAddForm(false);
        }
      });
    }
  };

  const getTotalStaffByRole = () => {
    const totals = staffing.reduce((acc, staff) => {
      acc[staff.role] = (acc[staff.role] || 0) + staff.qty;
      return acc;
    }, {} as Record<string, number>);
    return totals;
  };

  const totalStaff = staffing.reduce((sum, staff) => sum + staff.qty, 0);
  const staffTotals = getTotalStaffByRole();

  return (
    <div className="space-y-6">
      {/* Staffing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staffing Summary
          </CardTitle>
          <CardDescription>
            Total Staff Required: {totalStaff}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(staffTotals).map(([role, count]) => (
              <div key={role} className="text-center p-3 border rounded-lg">
                <div className="font-['Work_Sans'] font-medium text-lg">{count}</div>
                <div className="text-sm text-muted-foreground">{role}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staffing Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg">Staffing Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {staffing.map((staff) => (
              <div key={staff.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-['Work_Sans'] font-medium">{staff.role}</h4>
                    <Badge variant="secondary">{staff.qty} person{staff.qty > 1 ? 's' : ''}</Badge>
                    {staff.hourly_rate && (
                      <Badge variant="outline">£{staff.hourly_rate}/hr</Badge>
                    )}
                  </div>
                  
                  {(staff.shift_start || staff.shift_end) && (
                    <div className="text-sm text-muted-foreground mb-1">
                      Shift: {staff.shift_start || 'TBC'} - {staff.shift_end || 'TBC'}
                    </div>
                  )}
                  
                  {staff.notes && (
                    <p className="text-sm text-muted-foreground italic">{staff.notes}</p>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingId(staff.id);
                      setFormData({
                        role: staff.role,
                        qty: staff.qty.toString(),
                        shift_start: staff.shift_start || '',
                        shift_end: staff.shift_end || '',
                        hourly_rate: staff.hourly_rate?.toString() || '',
                        notes: staff.notes || ''
                      });
                      setShowAddForm(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteStaffingRequirement.mutate(staff.id)}
                    disabled={deleteStaffingRequirement.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Staffing Requirement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">
              {editingId ? 'Edit Staffing Requirement' : 'Add Staffing Requirement'}
            </CardTitle>
            <Button
              onClick={() => {
                if (!showAddForm) {
                  setEditingId(null);
                  setFormData({
                    role: '',
                    qty: '1',
                    shift_start: '',
                    shift_end: '',
                    hourly_rate: '',
                    notes: ''
                  });
                }
                setShowAddForm(!showAddForm);
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Cancel Edit' : 'Add Staffing'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
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

                <div>
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={formData.qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shift_start">Shift Start</Label>
                  <Input
                    id="shift_start"
                    type="time"
                    value={formData.shift_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift_start: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="shift_end">Shift End</Label>
                  <Input
                    id="shift_end"
                    type="time"
                    value={formData.shift_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift_end: e.target.value }))}
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
                  disabled={addStaffingRequirement.isPending || updateStaffingRequirement.isPending}
                >
                  {editingId ? 'Update Requirement' : 'Add Requirement'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};