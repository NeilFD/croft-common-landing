import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { useEventContacts, useContactMutations } from '@/hooks/useEventContacts';

interface ContactBuilderProps {
  eventId: string;
  eventData: any;
}

export const ContactBuilder: React.FC<ContactBuilderProps> = ({ eventId, eventData }) => {
  const { data: contacts = [], isLoading } = useEventContacts(eventId);
  const { addContact, updateContact, deleteContact } = useContactMutations(eventId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contact_type: 'vendor',
    name: '',
    role: '',
    phone: '',
    email: '',
    notes: ''
  });

  const contactTypes = [
    { value: 'primary', label: 'Primary Contact', badge: 'primary' },
    { value: 'management', label: 'Management', badge: 'internal' },
    { value: 'emergency', label: 'Emergency', badge: 'emergency' },
    { value: 'vendor', label: 'Vendor/Supplier', badge: 'external' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateContact.mutate({
        id: editingId,
        ...formData
      }, {
        onSuccess: () => {
          resetForm();
        }
      });
    } else {
      addContact.mutate(formData, {
        onSuccess: () => {
          resetForm();
        }
      });
    }
  };

  const handleEdit = (contact: any) => {
    setEditingId(contact.id);
    setFormData({
      contact_type: contact.contact_type,
      name: contact.name,
      role: contact.role || '',
      phone: contact.phone || '',
      email: contact.email || '',
      notes: contact.notes || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      contact_type: 'vendor',
      name: '',
      role: '',
      phone: '',
      email: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const groupedContacts = contacts.reduce((acc: any, contact: any) => {
    if (!acc[contact.contact_type]) {
      acc[contact.contact_type] = [];
    }
    acc[contact.contact_type].push(contact);
    return acc;
  }, {});

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'primary': return 'default';
      case 'management': return 'secondary';
      case 'emergency': return 'destructive';
      case 'vendor': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Display contacts by type */}
      {contactTypes.map(({ value, label }) => {
        const typeContacts = groupedContacts[value] || [];
        
        return (
          <Card key={value}>
            <CardHeader>
              <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {label}
              </CardTitle>
              <CardDescription>
                {value === 'primary' && 'Main point of contact for this event'}
                {value === 'management' && 'Internal management contacts'}
                {value === 'emergency' && 'Emergency contacts for day-of-event issues'}
                {value === 'vendor' && 'External suppliers and service providers'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeContacts.map((contact: any) => (
                  <div key={contact.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-['Work_Sans'] font-medium">{contact.name}</span>
                        <Badge variant={getBadgeVariant(contact.contact_type)}>
                          {contact.role || label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact.mutate(contact.id)}
                          disabled={deleteContact.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.notes && (
                        <p className="text-muted-foreground mt-2">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                ))}

                {typeContacts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No {label.toLowerCase()} contacts added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Add/Edit Contact Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">
              {editingId ? 'Edit Contact' : 'Add New Contact'}
            </CardTitle>
            <Button
              onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
              variant="outline"
            >
              {showAddForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" />Add Contact</>}
            </Button>
          </div>
        </CardHeader>

        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_type">Contact Type</Label>
                  <Select
                    value={formData.contact_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contact_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role/Title</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Catering Manager, Event Coordinator"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Additional information or special instructions"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addContact.isPending || updateContact.isPending}
                >
                  {editingId ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};