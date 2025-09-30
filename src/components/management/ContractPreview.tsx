import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Mail, 
  PenTool, 
  Check, 
  Clock, 
  Loader2,
  PoundSterling,
  Users,
  CalendarDays,
  MapPin
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useManagementAuth } from '@/hooks/useManagementAuth';

const BRAND_LOGO = '/brand/logo.png';

interface ContractPreviewProps {
  eventId: string;
}

export const ContractPreview = ({ eventId }: ContractPreviewProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { managementUser } = useManagementAuth();
  
  const [showSignature, setShowSignature] = useState(false);
  const signaturePadRef = useRef<SignatureCanvas>(null);

  // Fetch event data
  const { data: eventData } = useQuery({
    queryKey: ['management-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });

  // Fetch contract data
  const { data: contractData, refetch: refetchContract } = useQuery({
    queryKey: ['contract', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('event_id', eventId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });

  // Fetch line items
  const { data: lineItems } = useQuery({
    queryKey: ['line-items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_event_line_items')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Generate contract mutation
  const generateContract = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_contract', {
        p_event_id: eventId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional contract generated successfully with all terms and conditions",
      });
      refetchContract();
      queryClient.invalidateQueries({ queryKey: ['contract', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Contract Generation Failed",
        description: error.message || 'Failed to generate contract. Please try again.',
        variant: "destructive",
      });
    }
  });

  // Generate and download PDF
  const generateContractPdf = useMutation({
    mutationFn: async (eventId: string) => {
      console.log('🔄 Generating contract PDF...');
      const response = await supabase.functions.invoke('generate-contract-pdf', {
        body: { eventId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate PDF');
      }

      return response.data;
    },
    onSuccess: async (data) => {
      console.log('✅ PDF generated:', data);
      
      // Download the PDF directly
      if (data?.url) {
        try {
          const response = await fetch(data.url);
          if (!response.ok) throw new Error('Failed to fetch PDF');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contract-${eventData?.code || 'unknown'}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download error:', error);
          toast({
            title: "Download Error",
            description: "Failed to download PDF",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Refetch to get updated PDF URL
      queryClient.invalidateQueries({ queryKey: ['contract', eventId] });
      toast({
        title: "Success",
        description: "Contract PDF downloaded successfully!",
      });
    },
    onError: (error) => {
      console.error('❌ PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Send contract via email
  const sendContractEmail = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const fileName = `contract-${eventData?.code || eventId}.pdf`;
      console.log('📧 Sending contract email (server will generate fresh PDF)...', { eventId, fileName });
      const response = await supabase.functions.invoke('send-contract-email', {
        body: { eventId, fileName }
      });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to send email');
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Contract email sent:', data);
      toast({
        title: "Email Sent Successfully",
        description: `Contract sent successfully to ${data?.sentTo}`,
      });
    },
    onError: (error) => {
      console.error('❌ Email sending error:', error);
      toast({
        title: "Email Send Failed",
        description: `Failed to send contract: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Sign contract as staff
  const signContractAsStaff = useMutation({
    mutationFn: async ({ eventId, signatureData }: { eventId: string; signatureData: any }) => {
      const { error } = await supabase
        .from('contracts')
        .update({
          staff_signature_data: signatureData,
          staff_signed_at: new Date().toISOString(),
          staff_signed_by: managementUser?.user?.id,
          signature_status: 'pending_client'
        })
        .eq('event_id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contract signed by Croft Common. Ready to send to client.",
      });
      setShowSignature(false);
      refetchContract();
      queryClient.invalidateQueries({ queryKey: ['contract', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to sign contract",
        variant: "destructive",
      });
      console.error('Contract signing error:', error);
    },
  });

  const handleSign = async () => {
    if (!signaturePadRef.current) return;
    
    const canvas = signaturePadRef.current.getCanvas();
    const signatureDataUrl = canvas.toDataURL();
    
    const signatureData = {
      signature: signatureDataUrl,
      timestamp: new Date().toISOString(),
      ip: 'management-system'
    };

    try {
      // Staff can only sign as staff (Croft Common)
      await signContractAsStaff.mutateAsync({
        eventId: eventId!,
        signatureData
      });
      
      setShowSignature(false);
      clearSignature();
    } catch (error) {
      console.error('Signing error:', error);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  // Calculate totals for display
  const calculateTotals = (items: any[], headcount: number) => {
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    items?.forEach(item => {
      const qty = Number(item.qty || 1);
      const unitPrice = Number(item.unit_price || 0);
      const multiplier = item.per_person ? headcount : 1;
      const gross = qty * unitPrice * multiplier;
      const net = gross / 1.2; // Assuming 20% VAT included
      const vat = gross - net;

      totalNet += net;
      totalVat += vat;
      totalGross += gross;
    });

    const serviceCharge = totalGross * (Number(eventData?.service_charge_pct || 0) / 100);
    const finalTotal = totalGross + serviceCharge;

    return {
      net: totalNet,
      vat: totalVat,
      gross: totalGross,
      serviceCharge,
      total: finalTotal
    };
  };

  // Format contract content with proper styling
  const formatContractContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Main section headers with ═══
      if (line.includes('═══')) {
        return (
          <h2 key={index} className="font-brutalist text-lg font-black text-center py-4 text-primary uppercase tracking-wider border-b border-primary/20">
            {line.replace(/═/g, '').trim()}
          </h2>
        );
      } 
      // Subsection headers with ───
      else if (line.includes('───')) {
        return (
          <h3 key={index} className="font-brutalist text-base font-bold py-3 text-primary/90 uppercase tracking-wide border-b border-primary/10">
            {line.replace(/─/g, '').trim()}
          </h3>
        );
      } 
      // Field labels (ending with colon like "CLIENT NAME:")
      else if (trimmedLine.match(/^[A-Z\s]+:$/)) {
        return (
          <p key={index} className="font-brutalist font-semibold py-1 text-foreground">
            {trimmedLine}
          </p>
        );
      }
      // Main section numbers (like "1. DEFINITIONS", "2. PAYMENT TERMS")
      else if (trimmedLine.match(/^\d+\.\s+[A-Z\s&]+$/)) {
        return (
          <h4 key={index} className="font-brutalist text-base font-bold py-3 text-foreground uppercase tracking-wide">
            {trimmedLine}
          </h4>
        );
      }
      // Subsection numbers with descriptions (like "4.1 Minimum spend requirements...")
      else if (trimmedLine.match(/^\d+\.\d+\s+/)) {
        const parts = trimmedLine.split(/^(\d+\.\d+)\s+/);
        if (parts.length >= 3) {
          return (
            <p key={index} className="py-2">
              <span className="font-brutalist font-semibold text-foreground">{parts[1]} </span>
              <span className="font-industrial leading-relaxed text-foreground/90">{parts[2]}</span>
            </p>
          );
        }
        return (
          <p key={index} className="font-industrial leading-relaxed text-foreground/90 py-1">
            {trimmedLine}
          </p>
        );
      }
      // Empty lines
      else if (trimmedLine === '') {
        return <div key={index} className="py-1" />;
      } 
      // Regular body text
      else {
        return (
          <p key={index} className="font-industrial leading-relaxed text-foreground/90 py-1">
            {trimmedLine}
          </p>
        );
      }
    });
  };

  if (!eventData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totals = calculateTotals(lineItems || [], eventData.headcount || 0);

  return (
    <div className="space-y-6">
      {/* Event Summary Card */}
      <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{eventData.event_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {eventData.primary_date ? new Date(eventData.primary_date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Date TBC'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary/70" />
                  <span className="font-medium">{eventData.headcount || 0}</span>
                  <span className="text-muted-foreground">guests</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary/70" />
                  <span className="text-muted-foreground">Croft Common</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <PoundSterling className="w-4 h-4 text-primary/70" />
                  <span className="font-medium">£{totals.total.toFixed(2)}</span>
                  <span className="text-muted-foreground">total</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Contract Card */}
      <Card className="border-2 border-primary/10">
        <CardContent className="p-0">
          {!contractData ? (
            <div className="text-center py-16 px-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Generate Contract</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create a comprehensive event contract with all terms, conditions, and pricing details
              </p>
              <Button 
                onClick={() => generateContract.mutate()}
                disabled={generateContract.isPending}
                size="lg"
                className="bg-primary hover:bg-primary/90 font-semibold px-8"
              >
                {generateContract.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Generating Professional Contract...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-3" />
                    GENERATE CONTRACT
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Contract Status Header */}
              <div className="bg-muted/30 p-6 border-b border-muted">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={contractData.signature_status === 'completed' ? "default" : "secondary"}
                      className={contractData.signature_status === 'completed' ? "bg-green-600 hover:bg-green-700" : 
                                contractData.staff_signature_data ? "bg-blue-100 text-blue-800" : 
                                "bg-yellow-100 text-yellow-800"}
                    >
                      {contractData.signature_status === 'completed' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          FULLY EXECUTED
                        </>
                      ) : contractData.staff_signature_data ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          READY TO SEND
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          AWAITING STAFF SIGNATURE
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Version {contractData.version}</span>
                      <span>•</span>
                      <span>Generated {new Date(contractData.created_at!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Document Display */}
              <div className="p-8 bg-gradient-to-br from-white via-muted/10 to-muted/20">
                <div className="max-w-4xl mx-auto">
                  <div className="contract-content bg-white border-2 border-primary/10 rounded-xl shadow-xl overflow-hidden">
                    {/* Contract Header with Logo */}
                    <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-8 text-center relative">
                      <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border border-white/20">
                        <img 
                          src={BRAND_LOGO} 
                          alt="Croft Common Logo" 
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      <h1 className="font-brutalist text-3xl font-black tracking-wider mb-2">CROFT COMMON</h1>
                      <p className="font-brutalist text-lg opacity-90 tracking-wide uppercase">EVENT SERVICES CONTRACT</p>
                    </div>

                    {/* Contract Content */}
                    <div className="p-8 space-y-4 text-sm leading-relaxed">
                      {formatContractContent(contractData.content)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons and Status */}
              <div className="bg-muted/20 p-6 border-t border-muted">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground mb-1">Contract Status</p>
                    <p className="text-sm text-muted-foreground">
                      {contractData.staff_signature_data 
                        ? 'Croft Common has signed - ready to send to client'
                        : 'Contract awaiting Croft Common signature'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {!contractData?.staff_signature_data && (
                      <Button
                        onClick={() => setShowSignature(true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        SIGN FOR CROFT COMMON
                      </Button>
                    )}
                    
                    {contractData?.staff_signature_data && (
                      <>
                        <Button
                          onClick={() => sendContractEmail.mutate({ 
                            eventId: eventId!
                          })}
                          disabled={sendContractEmail.isPending}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          {sendContractEmail.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          SEND TO CLIENT
                        </Button>
                        
                        <Button
                          onClick={() => generateContractPdf.mutate(eventId!)}
                          disabled={generateContractPdf.isPending}
                          variant="outline"
                        >
                          {generateContractPdf.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          DOWNLOAD SIGNED PDF
                        </Button>
                      </>
                    )}
                    
                    {!contractData?.pdf_url && !contractData?.staff_signature_data && (
                      <Button
                        onClick={() => generateContractPdf.mutate(eventId!)}
                        disabled={generateContractPdf.isPending}
                        variant="outline"
                      >
                        {generateContractPdf.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        GENERATE PDF
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Signature Status Display */}
              <div className="p-6 border-t border-muted bg-muted/10">
                <h3 className="font-brutalist text-lg font-black uppercase tracking-wider mb-4 text-center">
                  SIGNATURE STATUS
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Croft Common Signature */}
                  <div className="border border-muted rounded-lg p-4">
                    <h4 className="font-brutalist text-sm font-black uppercase tracking-wider mb-3">
                      CROFT COMMON SIGNATURE
                    </h4>
                    {contractData?.staff_signature_data && typeof contractData.staff_signature_data === 'object' && contractData.staff_signature_data !== null && 'signature' in contractData.staff_signature_data ? (
                      <div className="space-y-3">
                        <div className="h-20 border border-muted rounded bg-white p-2 flex items-center justify-center">
                          <img 
                            src={contractData.staff_signature_data.signature as string} 
                            alt="Croft Common Signature"
                            className="max-h-16 max-w-full object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Status: <span className="font-medium text-green-600">Signed</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {contractData.staff_signed_at ? new Date(contractData.staff_signed_at).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-muted rounded flex items-center justify-center bg-muted/20">
                        <span className="text-sm text-muted-foreground font-industrial">
                          Awaiting signature
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Client Signature */}
                  <div className="border border-muted rounded-lg p-4">
                    <h4 className="font-brutalist text-sm font-black uppercase tracking-wider mb-3">
                      CLIENT SIGNATURE
                    </h4>
                    {contractData?.client_signature_data && typeof contractData.client_signature_data === 'object' && contractData.client_signature_data !== null && 'signature' in contractData.client_signature_data ? (
                      <div className="space-y-3">
                        <div className="h-20 border border-muted rounded bg-white p-2 flex items-center justify-center">
                          <img 
                            src={contractData.client_signature_data.signature as string} 
                            alt="Client Signature"
                            className="max-h-16 max-w-full object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Status: <span className="font-medium text-green-600">Signed</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {contractData.client_signed_at ? new Date(contractData.client_signed_at).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-muted rounded flex items-center justify-center bg-muted/20">
                        <span className="text-sm text-muted-foreground font-industrial">
                          {contractData?.staff_signature_data ? 'Ready for client signature' : 'Awaiting staff signature first'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Signature Modal */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">
              Sign as Croft Common Authorised Signatory
            </DialogTitle>
            <DialogDescription>
              As an authorised signatory of Croft Common, please sign to approve this contract before sending to client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Legal Notice:</p>
              <p className="text-xs text-muted-foreground">
                This digital signature has the same legal effect as a handwritten signature and constitutes your electronic acceptance of this contract.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Please sign in the box below:</Label>
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-white">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    width: 600,
                    height: 200,
                    className: 'signature-canvas w-full h-full rounded'
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Draw your signature above using your mouse or finger
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSign}
                disabled={signContractAsStaff.isPending}
                className="flex-1 bg-primary text-white hover:bg-primary/90 font-semibold"
              >
                {signContractAsStaff.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Signature...
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 mr-2" />
                    SIGN & APPROVE
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={clearSignature}
                disabled={signContractAsStaff.isPending}
                className="px-6"
              >
                Clear Signature
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowSignature(false)}
                disabled={signContractAsStaff.isPending}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};