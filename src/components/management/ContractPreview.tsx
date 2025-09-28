import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, PenTool, Mail, Loader2, Check, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';

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

  const formatContractContent = (content: string) => {
    // Contract content is now fully formatted by the database function
    return content;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section with Branding */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-brutalist tracking-tight">EVENT CONTRACT</h2>
              <p className="text-primary-foreground/80">Professional Event Services Agreement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">CROFT COMMON</p>
            <p className="text-xs text-primary-foreground/70">Events & Venue Services</p>
          </div>
        </div>
      </div>

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
              <div className="p-8 bg-white">
                <div className="max-w-4xl mx-auto">
                  <div className="contract-content bg-white border border-concrete/30 rounded-lg shadow-sm">
                    <div className="p-8 lg:p-12">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono tracking-tight text-charcoal">
                        {formatContractContent(contractData.content)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Actions */}
              {!contractData.is_signed && (
                <div className="bg-muted/20 p-6 border-t border-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">Ready to Execute Contract</h4>
                      <p className="text-sm text-muted-foreground">
                        Please review all terms carefully before signing
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        SEND TO CLIENT
                      </Button>
                      <Button
                        onClick={() => setShowSignature(true)}
                        className="bg-accent-pink text-white hover:bg-accent-pink-dark font-semibold"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        DIGITAL SIGNATURE
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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