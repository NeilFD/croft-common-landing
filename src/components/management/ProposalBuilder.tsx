import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  id?: string;
  type: 'room' | 'menu' | 'addon' | 'discount';
  description: string;
  qty: number;
  unit_price: number; // VAT-inclusive (gross) price
  per_person: boolean;
  sort_order: number;
}

interface ProposalBuilderProps {
  eventId: string;
  headcount?: number;
}

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ eventId, headcount = 1 }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      type: 'room',
      description: 'Event Space Hire',
      qty: 1,
      unit_price: 600, // VAT-inclusive price (£500 + 20% VAT)
      per_person: false,
      sort_order: 0
    }
  ]);
  
  const [serviceChargePct, setServiceChargePct] = useState<number>(0);

  // Fetch existing line items
  const { data: existingItems } = useQuery({
    queryKey: ['event-line-items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_line_items')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  React.useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setLineItems(existingItems.map(item => ({
        id: item.id,
        type: item.type as LineItem['type'],
        description: item.description,
        qty: item.qty,
        unit_price: parseFloat(item.unit_price?.toString() || '0'),
        per_person: item.per_person,
        sort_order: item.sort_order
      })));
    }
  }, [existingItems]);

  // Save proposal mutation
  const saveProposal = useMutation({
    mutationFn: async (items: LineItem[]) => {
      const { data, error } = await supabase.rpc('create_proposal', {
        p_event_id: eventId,
        p_items: items.map(item => ({
          type: item.type,
          description: item.description,
          qty: item.qty,
          unit_price: item.unit_price,
          per_person: item.per_person,
          sort_order: item.sort_order
        })),
        p_service_charge_pct: serviceChargePct
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Proposal saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['event-line-items', eventId] });
    },
    onError: (error) => {
      console.error('create_proposal failed', error);
      const msg = (error as any)?.message || 'Failed to save proposal';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
  });

  const addLineItem = () => {
    setLineItems([...lineItems, {
      type: 'addon',
      description: '',
      qty: 1,
      unit_price: 0,
      per_person: false,
      sort_order: lineItems.length
    }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], ...updates };
    setLineItems(newItems);
  };

  // Calculate net amount from VAT-inclusive price
  const calculateLineNet = (item: LineItem) => {
    const grossAmount = item.qty * item.unit_price * (item.per_person ? headcount : 1);
    // For VAT-inclusive pricing, net = gross / 1.2
    return grossAmount / 1.2;
  };

  const calculateLineVat = (item: LineItem) => {
    const grossAmount = item.qty * item.unit_price * (item.per_person ? headcount : 1);
    const netAmount = calculateLineNet(item);
    return grossAmount - netAmount;
  };

  const calculateLineTotal = (item: LineItem) => {
    return item.qty * item.unit_price * (item.per_person ? headcount : 1);
  };

  // Calculate totals
  const netSubtotal = lineItems.reduce((sum, item) => {
    if (item.type === 'discount') return sum - calculateLineNet(item);
    return sum + calculateLineNet(item);
  }, 0);

  const vatTotal = lineItems.reduce((sum, item) => {
    if (item.type === 'discount') return sum - calculateLineVat(item);
    return sum + calculateLineVat(item);
  }, 0);

  const serviceChargeAmount = netSubtotal * (serviceChargePct / 100);
  const grandTotal = netSubtotal + vatTotal + serviceChargeAmount;

  const getTypeColor = (type: LineItem['type']) => {
    const colors = {
      room: 'bg-primary text-primary-foreground',
      menu: 'bg-emerald-500 text-white',
      addon: 'bg-blue-500 text-white',
      discount: 'bg-red-500 text-white'
    };
    return colors[type] || 'bg-gray-500 text-white';
  };

  return (
    <div className="space-y-6">
      <Card className="border-4 border-black shadow-brutal">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-brutalist text-xl uppercase tracking-wider">
            PROPOSAL BUILDER
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="border-2 border-gray-300 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <Badge className={getTypeColor(item.type)}>
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`type-${index}`}>Type</Label>
                  <Select
                    value={item.type}
                    onValueChange={(value) => updateLineItem(index, { type: value as LineItem['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room Hire</SelectItem>
                      <SelectItem value="menu">Menu Package</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1 lg:col-span-2">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateLineItem(index, { description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>

                <div>
                  <Label htmlFor={`qty-${index}`}>Quantity</Label>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateLineItem(index, { qty: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`price-${index}`}>
                    Gross Price (£) <span className="text-sm text-muted-foreground">(inc. VAT)</span>
                  </Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id={`per-person-${index}`}
                    checked={item.per_person}
                    onCheckedChange={(checked) => updateLineItem(index, { per_person: checked })}
                  />
                  <Label htmlFor={`per-person-${index}`}>Per Person</Label>
                </div>

                <div className="flex items-end">
                  <div className="text-right w-full">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Net: £{calculateLineNet(item).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        VAT: £{calculateLineVat(item).toFixed(2)}
                      </div>
                      <div className="font-bold text-lg">
                        Total: £{calculateLineTotal(item).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button onClick={addLineItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Totals Panel */}
      <Card className="border-4 border-black shadow-brutal">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-brutalist text-xl uppercase tracking-wider">
            PROPOSAL TOTALS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-charge">Service Charge (%)</Label>
              <Input
                id="service-charge"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={serviceChargePct}
                onChange={(e) => setServiceChargePct(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
            
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>Net Subtotal:</span>
                <span className="font-bold">£{netSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (20%):</span>
                <span className="font-bold">£{vatTotal.toFixed(2)}</span>
              </div>
              {serviceChargePct > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({serviceChargePct}%):</span>
                  <span className="font-bold">£{serviceChargeAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-black pt-2 flex justify-between text-xl font-bold">
                <span>GRAND TOTAL:</span>
                <span>£{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button 
              onClick={() => saveProposal.mutate(lineItems)}
              disabled={saveProposal.isPending}
              className="font-industrial uppercase tracking-wider"
            >
              {saveProposal.isPending ? 'SAVING...' : 'SAVE PROPOSAL'}
            </Button>
            <Button variant="outline" className="font-industrial uppercase tracking-wider">
              PREVIEW
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};