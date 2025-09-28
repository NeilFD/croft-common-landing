import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Plus, Send, Eye, CreditCard } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InvoiceManagerProps {
  eventId: string;
}

interface CreateInvoiceData {
  amount: number;
  due_date: string;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [createInvoiceData, setCreateInvoiceData] = useState<CreateInvoiceData>({
    amount: 0,
    due_date: ''
  });

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          payments (
            id,
            amount,
            method,
            received_at
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const { data: result, error } = await supabase.rpc('create_invoice', {
        p_event_id: eventId,
        p_due_date: data.due_date,
        p_amount: data.amount
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setShowCreateInvoice(false);
      setCreateInvoiceData({ amount: 0, due_date: '' });
      queryClient.invalidateQueries({ queryKey: ['invoices', eventId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  });

  // Send invoice mutation
  const sendInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices', eventId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500 text-white',
      sent: 'bg-blue-500 text-white',
      paid: 'bg-green-500 text-white',
      void: 'bg-red-500 text-white',
      refunded: 'bg-orange-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const calculateTotalPaid = (payments: any[]) => {
    return payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  };

  const handleCreateInvoice = () => {
    if (!createInvoiceData.amount || !createInvoiceData.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createInvoice.mutate(createInvoiceData);
  };

  if (isLoading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-4 border-black shadow-brutal">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-brutalist text-xl uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              INVOICE MANAGER
            </div>
            <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="font-industrial">
                  <Plus className="h-4 w-4 mr-2" />
                  CREATE INVOICE
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-brutalist uppercase tracking-wider">
                    Create New Invoice
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (£)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={createInvoiceData.amount}
                      onChange={(e) => setCreateInvoiceData(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={createInvoiceData.due_date}
                      onChange={(e) => setCreateInvoiceData(prev => ({
                        ...prev,
                        due_date: e.target.value
                      }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateInvoice}
                      disabled={createInvoice.isPending}
                      className="font-industrial uppercase tracking-wider flex-1"
                    >
                      {createInvoice.isPending ? 'CREATING...' : 'CREATE'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreateInvoice(false)}
                      className="font-industrial uppercase tracking-wider"
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Created</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to start billing for this event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-industrial">NUMBER</TableHead>
                    <TableHead className="font-industrial">STATUS</TableHead>
                    <TableHead className="font-industrial">DUE DATE</TableHead>
                    <TableHead className="font-industrial">TOTAL</TableHead>
                    <TableHead className="font-industrial">PAID</TableHead>
                    <TableHead className="font-industrial">BALANCE</TableHead>
                    <TableHead className="font-industrial">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const totalPaid = calculateTotalPaid(invoice.payments);
                    const balance = parseFloat(invoice.total.toString()) - totalPaid;
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-semibold">
                          {invoice.number}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          £{parseFloat(invoice.total.toString()).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          £{totalPaid.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          £{balance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => sendInvoice.mutate(invoice.id)}
                                disabled={sendInvoice.isPending}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                            {invoice.status === 'sent' && balance > 0 && (
                              <Button variant="ghost" size="sm">
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {invoices && invoices.length > 0 && (
        <Card className="border-4 border-black shadow-brutal">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-brutalist text-xl uppercase tracking-wider">
              INVOICE SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  £{invoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Invoiced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  £{invoices.reduce((sum, inv) => sum + calculateTotalPaid(inv.payments), 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  £{invoices.reduce((sum, inv) => {
                    const balance = parseFloat(inv.total.toString()) - calculateTotalPaid(inv.payments);
                    return sum + balance;
                  }, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};