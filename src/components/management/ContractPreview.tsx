import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, CheckCircle, Signature } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SignaturePad from 'react-signature-canvas';

interface ContractPreviewProps {
  eventId: string;
}

export const ContractPreview: React.FC<ContractPreviewProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sigPadRef = useRef<SignaturePad>(null);
  const [showSignature, setShowSignature] = useState(false);

  // Fetch event data
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch contract data
  const { data: contract, refetch: refetchContract } = useQuery({
    queryKey: ['contract', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('event_id', eventId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
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
        description: "Contract generated successfully",
      });
      refetchContract();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate contract",
        variant: "destructive",
      });
    }
  });

  // Sign contract mutation
  const signContract = useMutation({
    mutationFn: async (signatureData: string) => {
      if (!contract) throw new Error('No contract to sign');
      
      const { data, error } = await supabase
        .from('contracts')
        .update({
          is_signed: true,
          signed_at: new Date().toISOString(),
          signature_data: { signature: signatureData },
          is_immutable: true
        })
        .eq('id', contract.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contract signed successfully",
      });
      setShowSignature(false);
      refetchContract();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign contract",
        variant: "destructive",
      });
    }
  });

  const handleSign = () => {
    if (sigPadRef.current) {
      const signatureData = sigPadRef.current.toDataURL();
      signContract.mutate(signatureData);
    }
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const formatContractContent = (content: string, eventData: any) => {
    if (!eventData) return content;
    
    return content
      .replace(/{{client_name}}/g, eventData.title || 'Client Name')
      .replace(/{{event_date}}/g, new Date(eventData.date).toLocaleDateString('en-GB'))
      .replace(/{{event_type}}/g, eventData.category || 'Event')
      .replace(/{{location}}/g, eventData.location || 'Venue');
  };

  return (
    <div className="space-y-6">
      <Card className="border-4 border-black shadow-brutal">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-brutalist text-xl uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CONTRACT PREVIEW
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!contract ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contract Generated</h3>
              <p className="text-gray-600 mb-4">Generate a contract for this event to get started.</p>
              <Button 
                onClick={() => generateContract.mutate()}
                disabled={generateContract.isPending}
                className="font-industrial uppercase tracking-wider"
              >
                {generateContract.isPending ? 'GENERATING...' : 'GENERATE CONTRACT'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contract Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={contract.is_signed ? "default" : "secondary"}>
                    {contract.is_signed ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        SIGNED
                      </>
                    ) : (
                      'DRAFT'
                    )}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Version {contract.version}
                  </span>
                </div>
                
                {contract.signed_at && (
                  <div className="text-sm text-gray-600">
                    Signed: {new Date(contract.signed_at).toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>

              {/* Contract Content */}
              <div className="border-2 border-gray-300 p-6 bg-white min-h-[400px]">
                <div className="text-center mb-8">
                  <div className="font-brutalist text-2xl font-bold mb-2">CROFT COMMON</div>
                  <div className="text-pink-600 font-semibold">EVENT MANAGEMENT</div>
                </div>
                
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {formatContractContent(contract.content, event)}
                </pre>
                
                {contract.is_signed && contract.signature_data && (
                  <div className="mt-8 border-t pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-semibold">Client Signature:</p>
                        {contract.signature_data && typeof contract.signature_data === 'object' && 'signature' in contract.signature_data && (
                          <img 
                            src={contract.signature_data.signature as string} 
                            alt="Client Signature" 
                            className="max-h-16 border"
                          />
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p>Date: {new Date(contract.signed_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!contract.is_signed && (
                <div className="flex gap-4">
                  <Button 
                    onClick={() => setShowSignature(true)}
                    className="font-industrial uppercase tracking-wider"
                  >
                    <Signature className="h-4 w-4 mr-2" />
                    SIGN CONTRACT
                  </Button>
                  <Button 
                    variant="outline"
                    className="font-industrial uppercase tracking-wider"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    SEND FOR SIGNATURE
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Modal */}
      {showSignature && (
        <Card className="border-4 border-black shadow-brutal">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-brutalist text-xl uppercase tracking-wider">
              DIGITAL SIGNATURE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please sign in the box below to accept the contract terms.
              </p>
              
              <div className="border-2 border-gray-300 bg-white">
                <SignaturePad
                  ref={sigPadRef}
                  canvasProps={{
                    className: 'w-full h-32',
                    style: { width: '100%', height: '128px' }
                  }}
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSign}
                  disabled={signContract.isPending}
                  className="font-industrial uppercase tracking-wider"
                >
                  {signContract.isPending ? 'SIGNING...' : 'CONFIRM SIGNATURE'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSignature}
                  className="font-industrial uppercase tracking-wider"
                >
                  CLEAR
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSignature(false)}
                  className="font-industrial uppercase tracking-wider"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};