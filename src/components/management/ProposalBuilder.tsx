import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2, Plus, GripVertical, Eye, Share2, Mail, MessageCircle, Loader2 } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { shareViaWhatsApp } from '@/services/whatsappService';

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sharingEmail, setSharingEmail] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);

  // Fetch existing line items
  const { data: existingItems } = useQuery({
    queryKey: ['event-line-items', eventId],
    queryFn: async () => {
      // First check if this is a management event or regular event
      const { data: managementEventData } = await supabase
        .from('management_events')
        .select('id')
        .eq('id', eventId)
        .maybeSingle();
      
      const isManagementEvent = !!managementEventData;
      const tableName = isManagementEvent ? 'management_event_line_items' : 'event_line_items';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch event details for proposal preview
  const { data: eventDetails } = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch proposal PDFs count for version tracking
  const { data: proposalPdfs } = useQuery({
    queryKey: ['proposal-pdfs', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_pdfs')
        .select('id')
        .eq('event_id', eventId);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Hydrate service charge from event details
  React.useEffect(() => {
    if (eventDetails?.service_charge_pct !== undefined) {
      setServiceChargePct(eventDetails.service_charge_pct);
    }
  }, [eventDetails]);

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
        p_line_items: items.map(item => ({
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
      // Invalidate both queries to ensure service charge persists
      queryClient.invalidateQueries({ queryKey: ['event-line-items', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
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

  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      const { data, error } = await supabase.functions.invoke('generate-proposal-pdf', {
        body: { 
          eventId
        }
      });

      if (error) throw error;
      
      if (data?.pdfUrl) {
        // Invalidate proposal PDFs to update version count
        queryClient.invalidateQueries({ queryKey: ['proposal-pdfs', eventId] });
        return data.pdfUrl;
      } else {
        throw new Error('No PDF URL received');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleEmailShare = async () => {
    const pdfUrl = await generatePDF();
    if (!pdfUrl) return;

    // Open mailto link with proposal details
    const subject = `Event Proposal - ${eventDetails?.code || eventId}`;
    const body = `Dear Client,

Please find your event proposal attached below:

Proposal Reference: ${eventDetails?.code || eventId}
Event Date: ${eventDetails?.primary_date ? new Date(eventDetails.primary_date).toLocaleDateString('en-GB') : 'TBC'}
Headcount: ${eventDetails?.headcount || headcount} guests

Proposal PDF: ${pdfUrl}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Croft Common Team

---
Croft Common
hello@thehive-hospitality.com
www.croftcommontest.com`;

    const mailtoUrl = `mailto:${eventDetails?.client_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    toast({
      title: "Email opened",
      description: "Your email client should open with the proposal details.",
    });
  };

  const handleWhatsAppShare = async () => {
    const pdfUrl = await generatePDF();
    if (!pdfUrl) return;

    try {
      const message = `Hi! Here's your event proposal for ${eventDetails?.event_type || 'your event'} on ${eventDetails?.primary_date ? new Date(eventDetails.primary_date).toLocaleDateString('en-GB') : 'TBC'}.

Proposal Reference: ${eventDetails?.code || eventId}
Headcount: ${eventDetails?.headcount || headcount} guests

Download your proposal: ${pdfUrl}

Any questions? Just let us know!

Best regards,
Croft Common Team`;

      // Use WhatsApp Web URL for sharing
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "WhatsApp opened",
        description: "WhatsApp should open with your proposal message ready to send.",
      });
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        title: "Error", 
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-industrial uppercase tracking-wider">
                  <Eye className="h-4 w-4 mr-2" />
                  PREVIEW
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto pt-12 pr-12">
                <DialogTitle className="sr-only">Proposal Preview</DialogTitle>
                <DialogDescription className="sr-only">
                  Preview of the event proposal including client details, event information, and cost breakdown
                </DialogDescription>
                <div className="bg-white text-black min-h-full">
                  {/* Header with Branding */}
                  <div className="border-b-4 border-black pb-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <CroftLogo size="lg" className="h-12 w-12" />
                        <div>
                          <h1 className="text-3xl font-brutalist uppercase tracking-wider">CROFT COMMON</h1>
                          <p className="text-lg font-industrial uppercase tracking-wide text-muted-foreground">Private Events & Corporate Hire</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-brutalist uppercase tracking-wider">PROPOSAL</h2>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          <p><strong>Proposal Ref:</strong> {eventDetails?.code || '2025002'}</p>
                          <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                          <p><strong>Version:</strong> v{(proposalPdfs?.length || 0) + 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client and Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-lg font-brutalist uppercase tracking-wider border-b-2 border-black pb-2 mb-4">
                        CLIENT DETAILS
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {eventDetails?.client_name || 'Michael Brown'}</p>
                        <p><strong>Email:</strong> {eventDetails?.client_email || 'michael.brown@techcorp.com'}</p>
                        <p><strong>Phone:</strong> {eventDetails?.client_phone || '07987 654321'}</p>
                        <p><strong>Company:</strong> {eventDetails?.client_name || 'TechCorp Ltd'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-brutalist uppercase tracking-wider border-b-2 border-black pb-2 mb-4">
                        EVENT DETAILS
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Event Date:</strong> {eventDetails?.primary_date ? new Date(eventDetails.primary_date).toLocaleDateString('en-GB') : '28/09/2025'}</p>
                        <p><strong>Event Type:</strong> {eventDetails?.event_type || 'Presentation'}</p>
                        <p><strong>Headcount:</strong> {eventDetails?.headcount || headcount} guests</p>
                         <p><strong>Space:</strong> TBC</p>
                         <p><strong>Status:</strong> <Badge variant="secondary" className="ml-1">
                           DRAFT
                        </Badge></p>
                      </div>
                    </div>
                  </div>

                  {/* Venue Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-brutalist uppercase tracking-wider border-b-2 border-black pb-2 mb-4">
                      VENUE DETAILS
                    </h3>
                    <div className="bg-gray-50 p-4 border-2 border-gray-300">
                       <p><strong>Space:</strong> TBC</p>
                       <p><strong>Capacity:</strong> TBC</p>
                      <p><strong>Setup:</strong> Theatre style with presentation equipment</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="mb-8">
                    <h3 className="text-lg font-brutalist uppercase tracking-wider border-b-2 border-black pb-2 mb-4">
                      PROPOSAL BREAKDOWN
                    </h3>
                    <div className="space-y-3">
                      {lineItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge className={getTypeColor(item.type)} variant="default">
                                {item.type.toUpperCase()}
                              </Badge>
                              <span className="font-medium text-base">{item.description}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 ml-16">
                              Qty: {item.qty} × £{item.unit_price.toFixed(2)}
                              {item.per_person && ` × ${headcount} people`}
                            </div>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <div className="font-bold text-lg">£{calculateLineTotal(item).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              Net: £{calculateLineNet(item).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              VAT: £{calculateLineVat(item).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t-4 border-black pt-6 mb-8">
                    <div className="space-y-3 text-lg">
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
                      <div className="border-t-2 border-black pt-3 flex justify-between text-2xl font-bold">
                        <span>GRAND TOTAL:</span>
                        <span>£{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t-2 border-gray-300 pt-6 mt-8 text-sm text-muted-foreground">
                    <div className="text-center space-y-2">
                      <p className="font-bold text-black">CROFT COMMON</p>
                      <p>Unit 1-3, Croft Court, 48 Croft Street, London, SE8 4EX</p>
                      <p>Email: hello@thehive-hospitality.com | Phone: 020 7946 0958</p>
                      <p className="text-xs mt-4">
                        This proposal is valid for 30 days from the date of issue. Terms and conditions apply.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={generatingPDF || sharingEmail || sharingWhatsApp} className="font-industrial uppercase tracking-wider">
                  {(generatingPDF || sharingEmail || sharingWhatsApp) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  SHARE
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                <DropdownMenuItem 
                  onClick={handleEmailShare}
                  disabled={sharingEmail || generatingPDF}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Client
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleWhatsAppShare}
                  disabled={generatingPDF || sharingWhatsApp}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};