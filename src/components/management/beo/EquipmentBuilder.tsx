import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Wrench, Truck, Pencil } from 'lucide-react';
import { EventEquipment, useBEOMutations } from '@/hooks/useBEOData';
import { format, parseISO } from 'date-fns';

interface EquipmentBuilderProps {
  eventId: string;
  equipment: EventEquipment[];
}

export const EquipmentBuilder: React.FC<EquipmentBuilderProps> = ({ eventId, equipment }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    item_name: '',
    quantity: '1',
    specifications: '',
    delivery_time: '',
    collection_time: '',
    hire_cost: '',
    supplier: '',
    contact_details: '',
    setup_instructions: ''
  });

  const { addEquipmentItem, deleteEquipmentItem, updateEquipmentItem } = useBEOMutations(eventId);

  const equipmentCategories = [
    'AV',
    'Furniture',
    'Technical',
    'Catering',
    'Security',
    'Lighting',
    'Decor',
    'Transportation',
    'Cleaning',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const equipmentData = {
      category: formData.category,
      item_name: formData.item_name,
      quantity: parseInt(formData.quantity),
      specifications: formData.specifications || undefined,
      delivery_time: formData.delivery_time || undefined,
      collection_time: formData.collection_time || undefined,
      hire_cost: formData.hire_cost ? parseFloat(formData.hire_cost) : undefined,
      supplier: formData.supplier || undefined,
      contact_details: formData.contact_details || undefined,
      setup_instructions: formData.setup_instructions || undefined
    };
    
    if (editingId) {
      updateEquipmentItem.mutate({ id: editingId, ...equipmentData }, {
        onSuccess: () => {
          setFormData({
            category: '',
            item_name: '',
            quantity: '1',
            specifications: '',
            delivery_time: '',
            collection_time: '',
            hire_cost: '',
            supplier: '',
            contact_details: '',
            setup_instructions: ''
          });
          setEditingId(null);
          setShowAddForm(false);
        }
      });
    } else {
      addEquipmentItem.mutate(equipmentData, {
        onSuccess: () => {
          setFormData({
            category: '',
            item_name: '',
            quantity: '1',
            specifications: '',
            delivery_time: '',
            collection_time: '',
            hire_cost: '',
            supplier: '',
            contact_details: '',
            setup_instructions: ''
          });
          setShowAddForm(false);
        }
      });
    }
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EventEquipment[]>);

  const totalCost = equipment.reduce((sum, item) => sum + (item.hire_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Equipment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipment Summary
          </CardTitle>
          <CardDescription>
            Total Items: {equipment.length} | Total Cost: £{totalCost.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(groupedEquipment).map(([category, items]) => (
              <div key={category} className="text-center p-3 border rounded-lg">
                <div className="font-['Work_Sans'] font-medium text-lg">{items.length}</div>
                <div className="text-sm text-muted-foreground">{category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment by Category */}
      {Object.entries(groupedEquipment).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-['Work_Sans'] font-medium text-lg">{item.item_name}</h4>
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        {item.hire_cost && (
                          <Badge variant="outline">£{item.hire_cost}</Badge>
                        )}
                      </div>
                      {item.specifications && (
                        <p className="text-sm text-muted-foreground mb-2">{item.specifications}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingId(item.id);
                          setFormData({
                            category: item.category,
                            item_name: item.item_name,
                            quantity: item.quantity.toString(),
                            specifications: item.specifications || '',
                            delivery_time: item.delivery_time || '',
                            collection_time: item.collection_time || '',
                            hire_cost: item.hire_cost?.toString() || '',
                            supplier: item.supplier || '',
                            contact_details: item.contact_details || '',
                            setup_instructions: item.setup_instructions || ''
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteEquipmentItem.mutate(item.id)}
                        disabled={deleteEquipmentItem.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {(item.delivery_time || item.collection_time) && (
                      <div>
                        <div className="font-['Work_Sans'] font-medium mb-1 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Logistics
                        </div>
                        <div className="text-muted-foreground">
                          {item.delivery_time && (
                            <>Delivery: {format(parseISO(item.delivery_time), 'HH:mm dd/MM')}<br /></>
                          )}
                          {item.collection_time && (
                            <>Collection: {format(parseISO(item.collection_time), 'HH:mm dd/MM')}</>
                          )}
                        </div>
                      </div>
                    )}

                    {item.supplier && (
                      <div>
                        <div className="font-['Work_Sans'] font-medium mb-1">Supplier</div>
                        <div className="text-muted-foreground">
                          {item.supplier}
                          {item.contact_details && (
                            <><br />{item.contact_details}</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {item.setup_instructions && (
                    <div className="mt-3 p-2 bg-muted rounded">
                      <div className="font-['Work_Sans'] font-medium text-sm mb-1">Setup Instructions</div>
                      <div className="text-sm text-muted-foreground">{item.setup_instructions}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Equipment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">
              {editingId ? 'Edit Equipment' : 'Add Equipment'}
            </CardTitle>
            <Button
              onClick={() => {
                if (!showAddForm) {
                  setEditingId(null);
                  setFormData({
                    category: '',
                    item_name: '',
                    quantity: '',
                    specifications: '',
                    delivery_time: '',
                    collection_time: '',
                    hire_cost: '',
                    supplier: '',
                    contact_details: '',
                    setup_instructions: ''
                  });
                }
                setShowAddForm(!showAddForm);
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Cancel Edit' : 'Add Equipment'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hire_cost">Hire Cost (£)</Label>
                  <Input
                    id="hire_cost"
                    type="number"
                    step="0.01"
                    value={formData.hire_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_cost: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_time">Delivery Time</Label>
                  <Input
                    id="delivery_time"
                    type="datetime-local"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="collection_time">Collection Time</Label>
                  <Input
                    id="collection_time"
                    type="datetime-local"
                    value={formData.collection_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, collection_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specifications">Specifications</Label>
                <Textarea
                  id="specifications"
                  value={formData.specifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="contact_details">Contact Details</Label>
                <Input
                  id="contact_details"
                  value={formData.contact_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_details: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="setup_instructions">Setup Instructions</Label>
                <Textarea
                  id="setup_instructions"
                  value={formData.setup_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, setup_instructions: e.target.value }))}
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
                  disabled={addEquipmentItem.isPending || updateEquipmentItem.isPending}
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