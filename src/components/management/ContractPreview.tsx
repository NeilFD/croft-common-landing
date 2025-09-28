import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, PenTool, Mail, Loader2, Check, Clock, Download, Building, Users, CalendarDays, PoundSterling } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';
import { BRAND_LOGO } from '@/data/brand';

interface ContractPreviewProps {
  eventId: string;
}

export const ContractPreview: React.FC<ContractPreviewProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [showSignature, setShowSignature] = useState(false);

  // Fetch event data
  const { data: eventData } = useQuery({
    queryKey: ['management-event', eventId],
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
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch line items for totals calculation
  const { data: lineItems } = useQuery({
    queryKey: ['management-event-line-items', eventId],
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

  // Sign contract mutation
  // Generate contract PDF mutation
  const generateContractPdf = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
        body: { eventId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Contract PDF generated successfully",
      });
      refetchContract();
    },
    onError: (error: any) => {
      toast({
        title: "PDF Generation Failed",
        description: error.message || 'Failed to generate PDF. Please try again.',
        variant: "destructive",
      });
    }
  });

  // Send contract email mutation
  const sendContractEmail = useMutation({
    mutationFn: async () => {
      if (!contractData?.pdf_url) {
        // Generate PDF first if it doesn't exist
        const pdfResult = await supabase.functions.invoke('generate-contract-pdf', {
          body: { eventId }
        });
        
        if (pdfResult.error) throw pdfResult.error;
        
        // Send email with generated PDF
        const { data, error } = await supabase.functions.invoke('send-contract-email', {
          body: { 
            eventId,
            pdfUrl: pdfResult.data.url,
            fileName: `contract-${eventData?.code || eventId}.pdf`
          }
        });
        
        if (error) throw error;
        return data;
      } else {
        // Send email with existing PDF
        const { data, error } = await supabase.functions.invoke('send-contract-email', {
          body: { 
            eventId,
            pdfUrl: contractData.pdf_url,
            fileName: `contract-${eventData?.code || eventId}.pdf`
          }
        });
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Email Sent Successfully",
        description: `Contract sent to ${data.sentTo}`,
      });
      refetchContract();
    },
    onError: (error: any) => {
      toast({
        title: "Email Send Failed",
        description: error.message || 'Failed to send contract email. Please try again.',
        variant: "destructive",
      });
    }
  });

  const signContract = useMutation({
    mutationFn: async (signatureData: string) => {
      if (!contractData) throw new Error('No contract available to sign');
      
      const { data, error } = await supabase
        .from('contracts')
        .update({
          is_signed: true,
          signed_at: new Date().toISOString(),
          signature_data: { signature: signatureData, timestamp: Date.now() },
          is_immutable: true
        })
        .eq('id', contractData.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Contract Executed",
        description: "Digital signature applied. Contract is now legally binding.",
      });
      setShowSignature(false);
      refetchContract();
      queryClient.invalidateQueries({ queryKey: ['contract', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Signature Failed",
        description: error.message || 'Failed to sign contract. Please try again.',
        variant: "destructive",
      });
    }
  });

  const handleSign = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      signContract.mutate(signatureData);
    } else {
      toast({
        title: "No Signature",
        description: "Please provide a signature before confirming",
        variant: "destructive",
      });
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  // Calculate totals from line items
  const calculateTotals = () => {
    if (!lineItems || !eventData) return { net: 0, vat: 0, gross: 0, serviceCharge: 0, total: 0 };
    
    let net = 0;
    let vat = 0;
    let gross = 0;
    
    const headcount = eventData.headcount || 1;
    
    for (const item of lineItems) {
      const qty = Number(item.qty || 1);
      const unit = Number(item.unit_price || 0);
      const multiplier = item.per_person ? headcount : 1;
      const lineGross = qty * unit * multiplier;
      const lineNet = lineGross / 1.2; // assuming 20% VAT included
      const lineVat = lineGross - lineNet;
      
      net += lineNet;
      vat += lineVat;
      gross += lineGross;
    }
    
    const serviceCharge = gross * (Number(eventData.service_charge_pct || 0) / 100);
    const total = gross + serviceCharge;
    
    return { net, vat, gross, serviceCharge, total };
  };

  const totals = calculateTotals();

  const formatContractContent = (content: string) => {
    const lines = content.split('\n');
    const formattedElements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Main headers (surrounded by ═══)
      if (trimmedLine.includes('═══')) {
        formattedElements.push(
          <div key={index} className="border-t-2 border-primary/20 my-6" />
        );
      }
      // Section headers (surrounded by ───) 
      else if (trimmedLine.includes('───')) {
        formattedElements.push(
          <div key={index} className="border-t border-primary/10 my-4" />
        );
      }
      // Headers and titles (typically uppercase or starting with numbers/letters followed by periods)
      else if (
        trimmedLine.match(/^[A-Z\s]{3,}$/) || // All caps titles
        trimmedLine.match(/^\d+\.\s/) || // Numbered sections
        trimmedLine.match(/^[A-Z][A-Z\s]*:/) || // Title case headers with colons
        trimmedLine.includes('EVENT HIRE AGREEMENT') ||
        trimmedLine.includes('TERMS AND CONDITIONS') ||
        trimmedLine.includes('CLIENT DETAILS') ||
        trimmedLine.includes('EVENT DETAILS') ||
        trimmedLine.includes('FINANCIAL SUMMARY')
      ) {
        formattedElements.push(
          <div key={index} className="font-brutalist text-lg font-bold text-primary mb-3 mt-6">
            {trimmedLine}
          </div>
        );
      }
      // Regular content lines
      else if (trimmedLine.length > 0) {
        formattedElements.push(
          <div key={index} className="font-industrial text-foreground mb-2 leading-relaxed">
            {line}
          </div>
        );
      }
      // Empty lines for spacing
      else {
        formattedElements.push(
          <div key={index} className="h-3" />
        );
      }
    });
    
    return <div className="space-y-1">{formattedElements}</div>;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section with Branding */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <img 
                src={BRAND_LOGO} 
                alt="Croft Common Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const nextElement = target.nextElementSibling as HTMLElement;
                  target.style.display = 'none';
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
              <FileText className="w-8 h-8 hidden" />
            </div>
            <div>
              <h2 className="text-2xl font-brutalist tracking-tight">EVENT CONTRACT</h2>
              <p className="text-primary-foreground/80">Professional Event Services Agreement</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-brutalist font-black">CROFT COMMON</h3>
            <p className="text-xs text-primary-foreground/80">Events & Venue Services</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Unit 1-3, Croft Court, London SE8 4EX</p>
          </div>
        </div>
      </div>

      {/* Totals Summary Card - Only show if contract exists */}
      {contractData && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-brutalist font-black text-primary">FINANCIAL SUMMARY</h3>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <PoundSterling className="w-3 h-3 mr-1" />
                Contract Totals
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground font-industrial">Subtotal (Net)</p>
                <p className="text-xl font-brutalist font-black text-foreground">£{totals.net.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground font-industrial">VAT (20%)</p>
                <p className="text-xl font-brutalist font-black text-foreground">£{totals.vat.toFixed(2)}</p>
              </div>
              {totals.serviceCharge > 0 && (
                <div className="text-center p-4 bg-white rounded-lg border border-muted">
                  <p className="text-sm text-muted-foreground font-industrial">Service Charge</p>
                  <p className="text-xl font-brutalist font-black text-foreground">£{totals.serviceCharge.toFixed(2)}</p>
                </div>
              )}
              <div className="text-center p-6 bg-primary text-primary-foreground rounded-lg border-2 border-primary">
                <p className="text-sm opacity-90 font-industrial">TOTAL DUE</p>
                <p className="text-2xl font-brutalist font-black">£{totals.total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Summary Card - Only show if contract exists */}
      {contractData && eventData && (
        <Card className="border-muted/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-brutalist font-black text-primary mb-4">EVENT SUMMARY</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground font-industrial">Event Date</p>
                  <p className="font-semibold">
                    {eventData.primary_date ? new Date(eventData.primary_date).toLocaleDateString('en-GB') : 'TBC'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground font-industrial">Guest Count</p>
                  <p className="font-semibold">{eventData.headcount || 'TBC'} guests</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground font-industrial">Event Type</p>
                  <p className="font-semibold">{eventData.event_type || 'Private Event'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                className="bg-accent-pink text-white hover:bg-accent-pink-dark font-semibold px-8"
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
                      variant={contractData.is_signed ? "default" : "secondary"}
                      className={contractData.is_signed ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {contractData.is_signed ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          SIGNED & EXECUTED
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          AWAITING SIGNATURE
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Version {contractData.version}</span>
                      <span>•</span>
                      <span>Generated {new Date(contractData.created_at!).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {contractData.signed_at && (
                    <div className="text-right text-sm">
                      <p className="font-medium text-foreground">Digitally Signed</p>
                      <p className="text-muted-foreground">
                        {new Date(contractData.signed_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
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
                      <h1 className="text-3xl font-brutalist font-black tracking-wider">CROFT COMMON</h1>
                      <p className="text-lg font-industrial tracking-wide opacity-90">EVENT SERVICES CONTRACT</p>
                      <div className="mt-4 text-sm opacity-80">
                        <p>Unit 1-3, Croft Court, 48 Croft Street, London SE8 4EX</p>
                        <p>hello@thehive-hospitality.com • www.croftcommontest.com</p>
                      </div>
                    </div>
                    
                    {/* Contract Content */}
                    <div className="p-8 lg:p-12">
                      <div className="contract-text text-base">
                        {formatContractContent(contractData.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Actions */}
              <div className="bg-muted/20 p-6 border-t border-muted">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Contract Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      {contractData.is_signed 
                        ? 'Contract is signed and legally binding' 
                        : 'Review contract and choose an action'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => generateContractPdf.mutate()}
                      disabled={generateContractPdf.isPending}
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/5"
                    >
                      {generateContractPdf.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          GENERATE PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => sendContractEmail.mutate()}
                      disabled={sendContractEmail.isPending}
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/5"
                    >
                      {sendContractEmail.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          SEND TO CLIENT
                        </>
                      )}
                    </Button>
                    {!contractData.is_signed && (
                      <Button
                        onClick={() => setShowSignature(true)}
                        className="bg-accent-pink text-white hover:bg-accent-pink-dark font-semibold"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        DIGITAL SIGNATURE
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Signature Display */}
              {contractData.is_signed && contractData.signature_data && (
                <div className="bg-green-50 p-6 border-t border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">Contract Executed</h4>
                      <div className="bg-white p-4 rounded-lg border border-green-200 inline-block">
                        <img 
                          src={typeof contractData.signature_data === 'object' && contractData.signature_data && 'signature' in contractData.signature_data ? contractData.signature_data.signature as string : ''} 
                          alt="Digital signature" 
                          className="max-w-xs max-h-16 object-contain"
                        />
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        Digitally signed and legally binding as of {new Date(contractData.signed_at!).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Signature Modal */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Digital Contract Signature</DialogTitle>
            <DialogDescription>
              By signing below, you acknowledge that you have read, understood, and agree to be legally bound by all terms and conditions of this contract.
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
                disabled={signContract.isPending}
                className="flex-1 bg-accent-pink text-white hover:bg-accent-pink-dark font-semibold"
              >
                {signContract.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Signature...
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 mr-2" />
                    EXECUTE CONTRACT
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={clearSignature}
                disabled={signContract.isPending}
                className="px-6"
              >
                Clear Signature
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowSignature(false)}
                disabled={signContract.isPending}
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