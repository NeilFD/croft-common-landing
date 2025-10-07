import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Send, Upload, FileText, Calendar, Users, Clock, Mail, Download, Link as LinkIcon, Plus, Trash2, FileCheck, CheckCircle, AlertCircle, DollarSign, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CroftLogo from '@/components/CroftLogo';
import { BRAND_NAME } from '@/data/brand';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { ProposalViewer } from '@/components/client-portal/ProposalViewer';

interface ClientSession {
  sessionId: string;
  eventId: string;
  contactEmail: string;
  csrfToken: string;
}

interface Event {
  id: string;
  title?: string;
  event_type?: string;
  primary_date?: string;
  start_time?: string;
  headcount?: number;
  client_name?: string;
  client_email?: string;
  budget?: number;
  status?: string;
  service_charge_percent?: number;
  notes?: string;
  event_code?: string;
}

interface Message {
  id: string;
  author: 'client' | 'team';
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ClientFile {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  storage_path: string;
  download_url?: string;
}

interface InspirationLink {
  id: string;
  url: string;
  link_type: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface BEO {
  id: string;
  version_no: number;
  generated_at: string;
  pdf_url: string | null;
}

interface Proposal {
  id: string;
  version_no: number;
  status: string;
  generated_at: string;
  pdf_url: string | null;
  content_snapshot: any;
}

interface Contract {
  id: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  client_signature: string | null;
  pdf_url: string | null;
}

const ClientPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [inspirationLinks, setInspirationLinks] = useState<InspirationLink[]>([]);
  const [beo, setBeo] = useState<BEO | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newInspirationUrl, setNewInspirationUrl] = useState('');
  const [addingInspiration, setAddingInspiration] = useState(false);
  const [signingContract, setSigningContract] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState(false);
  
  const signatureRef = useRef<SignatureCanvas>(null);

  const handleDownloadDocument = async (documentType: 'beo' | 'contract') => {
    if (!session) return;

    setLoadingDocument(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-document-signed-url', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
          document_type: documentType,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to get document URL');

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download document error:', error);
      toast.error(`Failed to open ${documentType === 'beo' ? 'BEO' : 'contract'}`);
    } finally {
      setLoadingDocument(false);
    }
  };

  const loadPortalData = async (sessionId: string, csrfToken: string) => {
    const { data, error } = await supabase.functions.invoke('client-portal-data', {
      body: { session_id: sessionId, csrf_token: csrfToken },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to load portal data');

    setEvent(data.event as Event);
    setMessages(data.messages as Message[]);
    setFiles(data.files as ClientFile[]);
    setInspirationLinks(data.inspirationLinks || []);
    setBeo(data.beo || null);
    setProposal(data.proposal || null);
    setContract(data.contract || null);
  };

  useEffect(() => {
    const sessionId = sessionStorage.getItem('client_session_id');
    const csrfToken = sessionStorage.getItem('client_csrf_token');
    const eventId = sessionStorage.getItem('client_event_id');
    
    if (!sessionId || !csrfToken || !eventId) {
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        await loadPortalData(sessionId, csrfToken);
        
        setSession({
          sessionId,
          csrfToken,
          eventId,
          contactEmail: sessionStorage.getItem('client_contact_email') || '',
        });

        setLoading(false);
      } catch (error) {
        console.error('[ClientPortal] Error:', error);
        setLoading(false);
        toast.error('Session expired or invalid');
      }
    };

    initSession();
  }, []);

  // Load line items for financial breakdown
  useEffect(() => {
    const loadLineItems = async () => {
      if (!session?.eventId) return;
      const { data: rawItems, error } = await supabase
        .from('management_event_line_items')
        .select('id, type, description, qty, unit_price, per_person, sort_order')
        .eq('event_id', session.eventId)
        .order('type', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('[ClientPortal] line items error:', error);
        setLineItems([]);
        return;
      }
      const mapped = (rawItems || []).map((item: any) => ({
        id: item.id,
        category: item.type,
        item_name: item.description,
        quantity: item.qty,
        unit_cost: item.unit_price,
        total_cost: (item.qty || 0) * (item.unit_price || 0),
        item_order: item.sort_order,
      }));
      setLineItems(mapped);
    };
    loadLineItems();
  }, [session?.eventId, proposal?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    setSendingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('client-send-message', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
          body: newMessage.trim(),
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send message');

      setNewMessage('');
      toast.success('Message sent');
      
      await loadPortalData(session.sessionId, session.csrfToken);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('session_id', session.sessionId);
      formData.append('csrf_token', session.csrfToken);
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('client-upload-file', {
        body: formData,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to upload file');

      await loadPortalData(session.sessionId, session.csrfToken);
      toast.success('File uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddInspiration = async () => {
    if (!newInspirationUrl.trim() || !session) return;

    setAddingInspiration(true);
    try {
      const { data, error } = await supabase.functions.invoke('client-add-inspiration', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
          url: newInspirationUrl.trim(),
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to add inspiration link');

      setNewInspirationUrl('');
      toast.success('Inspiration link added');
      
      await loadPortalData(session.sessionId, session.csrfToken);
    } catch (error) {
      console.error('Add inspiration error:', error);
      toast.error('Failed to add inspiration link');
    } finally {
      setAddingInspiration(false);
    }
  };

  const handleDeleteInspiration = async (linkId: string) => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('client-delete-inspiration', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
          link_id: linkId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to delete inspiration link');

      toast.success('Inspiration link removed');
      await loadPortalData(session.sessionId, session.csrfToken);
    } catch (error) {
      console.error('Delete inspiration error:', error);
      toast.error('Failed to remove inspiration link');
    }
  };

  const handleSignContract = async () => {
    if (!signatureRef.current || !session || !contract) return;

    if (signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    setSigningContract(true);
    try {
      const signatureData = signatureRef.current.toDataURL();

      const { data, error } = await supabase.functions.invoke('client-sign-contract', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
          contract_id: contract.id,
          signature_data: signatureData,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to sign contract');

      toast.success('Contract signed successfully');
      await loadPortalData(session.sessionId, session.csrfToken);
    } catch (error) {
      console.error('Sign contract error:', error);
      toast.error('Failed to sign contract');
    } finally {
      setSigningContract(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('client_session_id');
    sessionStorage.removeItem('client_csrf_token');
    sessionStorage.removeItem('client_event_id');
    sessionStorage.removeItem('client_contact_email');
    navigate('/');
    toast.success('Logged out');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="max-w-md w-full border-[3px] border-charcoal rounded-lg p-8 text-center bg-background">
          <h1 className="font-brutalist text-2xl uppercase mb-4 text-foreground">Session Required</h1>
          <p className="font-industrial text-steel mb-6">
            Please use the magic link provided to access your event portal.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b-[3px] border-black bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CroftLogo size="lg" />
            <div>
              <h1 className="font-brutalist text-xl uppercase tracking-wide text-foreground">{BRAND_NAME}</h1>
              <p className="font-industrial text-xs text-steel mt-0.5">Event Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-industrial text-sm text-steel mb-2">{session.contactEmail}</p>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-[3px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Single Column */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Event Details */}
        <div className="border-[3px] border-black rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Event Details</h2>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-[3px] border-black rounded-lg p-0 h-auto mb-6 bg-background">
              <TabsTrigger 
                value="overview" 
                className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1"
              >
                Documents
              </TabsTrigger>
              {contract && (
                <TabsTrigger 
                  value="contract" 
                  className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1"
                >
                  Contract
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {event.primary_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-steel mt-0.5" />
                      <div>
                        <p className="font-industrial text-xs uppercase text-steel mb-1">Date</p>
                        <p className="font-industrial font-medium text-foreground">
                          {format(new Date(event.primary_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-steel mt-0.5" />
                    <div>
                      <p className="font-industrial text-xs uppercase text-steel mb-1">Time</p>
                      <p className="font-industrial font-medium text-foreground">{event.start_time || 'TBC'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-steel mt-0.5" />
                    <div>
                      <p className="font-industrial text-xs uppercase text-steel mb-1">Guests</p>
                      <p className="font-industrial font-medium text-foreground">{event.headcount || 'TBC'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-steel mt-0.5" />
                    <div>
                      <p className="font-industrial text-xs uppercase text-steel mb-1">Event Type</p>
                      <p className="font-industrial font-medium text-foreground">{event.event_type || 'TBC'}</p>
                    </div>
                  </div>
                  {event.budget && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-steel mt-0.5" />
                      <div>
                        <p className="font-industrial text-xs uppercase text-steel mb-1">Budget</p>
                        <p className="font-industrial font-medium text-foreground">£{event.budget.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {event.event_code && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-steel mt-0.5" />
                      <div>
                        <p className="font-industrial text-xs uppercase text-steel mb-1">Event Code</p>
                        <p className="font-industrial font-medium text-foreground font-mono">{event.event_code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {event.notes && (
                <div className="pt-4 border-t-[3px] border-black">
                  <p className="font-industrial text-xs uppercase text-steel mb-2">Notes</p>
                  <p className="font-industrial text-sm text-foreground whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {beo && (
                <div className="border-[3px] border-black rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5 hover:border-accent-pink">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileCheck className="w-5 h-5 text-steel mt-0.5" />
                      <div>
                        <p className="font-industrial font-medium text-foreground">Banquet Event Order v{beo.version_no}</p>
                        <p className="font-industrial text-xs text-steel mt-1">
                          Created {format(new Date(beo.generated_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadDocument('beo')}
                      disabled={!beo.pdf_url || loadingDocument}
                      className="flex-shrink-0"
                      variant={beo.pdf_url ? 'default' : 'outline'}
                      title={!beo.pdf_url ? 'PDF not yet generated' : 'View BEO'}
                    >
                      {loadingDocument ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {beo.pdf_url ? 'View BEO' : 'Not Available'}
                    </Button>
                  </div>
                </div>
              )}
              
              {proposal && proposal.content_snapshot && (
                <div className="space-y-4">
                  <ProposalViewer 
                    content={proposal.content_snapshot}
                    versionNo={proposal.version_no}
                    generatedAt={proposal.generated_at}
                    lineItems={lineItems}
                    serviceChargePct={event.service_charge_percent || 0}
                  />
                </div>
              )}
              
              {proposal && !proposal.content_snapshot && (
                <div className="border-[3px] border-black rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5 hover:border-accent-pink">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-steel mt-0.5" />
                      <div>
                        <p className="font-industrial font-medium text-foreground">Proposal v{proposal.version_no}</p>
                        <p className="font-industrial text-xs text-steel mt-1">
                          Created {format(new Date(proposal.generated_at), 'MMM d, yyyy')}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs font-industrial uppercase border-[3px] rounded ${
                            proposal.status === 'approved' ? 'border-green-600 text-green-600' :
                            proposal.status === 'pending' ? 'border-yellow-600 text-yellow-600' :
                            'border-steel text-steel'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      disabled
                      variant="outline"
                      title="Proposal details not available"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Not Available
                    </Button>
                  </div>
                </div>
              )}

              {!proposal && !beo && (
                <p className="font-industrial text-sm text-steel text-center py-8">
                  No documents available yet
                </p>
              )}
            </TabsContent>

            {/* Contract Tab */}
            {contract && (
              <TabsContent value="contract" className="space-y-6">
                <div className="border-[3px] border-black rounded-lg p-6 bg-background">
                  <div className="flex items-center gap-3 mb-4">
                    {contract.status === 'signed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-industrial font-medium text-foreground">Contract Status</p>
                      <p className="font-industrial text-xs text-steel mt-1">
                        {contract.status === 'signed' 
                          ? `Signed on ${format(new Date(contract.signed_at!), 'MMM d, yyyy')}`
                          : 'Awaiting signature'
                        }
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDownloadDocument('contract')}
                    disabled={!contract.pdf_url || loadingDocument}
                    className="w-full mb-4"
                    variant={contract.pdf_url ? 'default' : 'outline'}
                    title={!contract.pdf_url ? 'Contract PDF not available' : 'View contract'}
                  >
                    {loadingDocument ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {contract.pdf_url ? 'View Contract PDF' : 'PDF Not Available'}
                  </Button>

                  {contract.status !== 'signed' && (
                    <div className="mt-6 pt-6 border-t-[3px] border-black">
                      <p className="font-industrial text-sm text-foreground mb-4">
                        Please sign below to accept the contract terms
                      </p>
                      <div className="border-[3px] border-black rounded-lg p-4 bg-background mb-4">
                        <SignatureCanvas
                          ref={signatureRef}
                          canvasProps={{
                            className: 'w-full h-32 border-[3px] border-black rounded bg-background',
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => signatureRef.current?.clear()}
                          className="flex-1 border-[3px] border-black rounded-lg py-2 px-4 font-industrial uppercase text-xs bg-background hover:bg-steel hover:text-background transition-all duration-300"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleSignContract}
                          disabled={signingContract}
                          className="flex-1 border-[3px] border-black rounded-lg py-2 px-4 font-industrial uppercase text-xs bg-black text-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 disabled:opacity-50"
                        >
                          {signingContract ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                              Signing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 inline" />
                              Sign Contract
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {contract.status === 'signed' && contract.client_signature && (
                    <div className="mt-6 pt-6 border-t-[3px] border-black">
                      <p className="font-industrial text-xs uppercase text-steel mb-2">Your Signature</p>
                      <img src={contract.client_signature} alt="Signature" className="border-[3px] border-black rounded-lg p-2 bg-background max-w-full h-40 object-contain" />
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Messages */}
        <div className="border-[3px] border-black rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Messages</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border-[3px] max-w-[70%] ${
                  msg.author === 'team'
                    ? 'border-accent-pink mr-auto'
                    : 'border-black ml-auto'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-brutalist text-xs uppercase">
                    {msg.author === 'team' ? 'Team' : 'You'}
                  </span>
                  <span className="font-industrial text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="font-industrial text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                No messages yet
              </p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t-[3px] border-black">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to the team..."
              className="font-industrial resize-none border-[3px] border-black rounded-lg bg-background focus:border-accent-pink"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="w-full border-[3px] border-black rounded-lg py-3 px-4 font-brutalist uppercase text-sm bg-black text-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 disabled:opacity-50"
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2 inline" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>

        {/* Files */}
        <div className="border-[3px] border-black rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Files</h2>

          <div className="space-y-3 mb-4">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 border-[3px] border-black rounded-lg bg-background hover:border-accent-pink hover:shadow-lg hover:shadow-accent-pink/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-industrial text-sm truncate">{file.filename}</p>
                    <p className="font-industrial text-xs text-muted-foreground">
                      {formatFileSize(file.size_bytes)} • {format(new Date(file.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {file.download_url && (
                  <a
                    href={file.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 border-[3px] border-black rounded-lg py-2 px-3 bg-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 inline-flex items-center"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
            {files.length === 0 && (
              <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                No files uploaded yet
              </p>
            )}
          </div>

          <div className="pt-4 border-t-[3px] border-black">
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile}
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="w-full border-[3px] border-black rounded-lg py-3 px-4 font-brutalist uppercase text-sm bg-black text-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 disabled:opacity-50 inline-block text-center cursor-pointer"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 inline" />
                    Upload File
                  </>
                )}
              </label>
            </label>
          </div>
        </div>

        {/* Inspiration */}
        <div className="border-[3px] border-black rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Inspiration Board</h2>

          <div className="space-y-3 mb-4">
            {inspirationLinks.map((link) => (
              <div 
                key={link.id} 
                className="border-[3px] border-black rounded-lg overflow-hidden bg-background hover:border-accent-pink hover:shadow-lg hover:shadow-accent-pink/10 transition-all duration-300"
              >
                {link.thumbnail_url && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img
                      src={link.thumbnail_url}
                      alt={link.title || 'Inspiration'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {link.title && (
                        <h3 className="font-industrial text-base font-bold mb-1 truncate">{link.title}</h3>
                      )}
                      {link.description && (
                        <p className="font-industrial text-sm text-muted-foreground line-clamp-2 mb-2">{link.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteInspiration(link.id)}
                      className="flex-shrink-0 p-2 border-[3px] border-black rounded-lg hover:bg-destructive hover:border-destructive transition-all duration-300"
                      aria-label="Delete inspiration link"
                    >
                      <Trash2 className="w-4 h-4 text-destructive hover:text-background transition-colors" />
                    </button>
                  </div>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-industrial text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    View Original Link
                  </a>
                </div>
              </div>
            ))}
            {inspirationLinks.length === 0 && (
              <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                No inspiration links yet
              </p>
            )}
          </div>

          <div className="pt-4 border-t-[3px] border-black flex gap-2">
            <Input
              value={newInspirationUrl}
              onChange={(e) => setNewInspirationUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInspiration();
                }
              }}
              placeholder="Paste inspiration link..."
              className="flex-1 font-industrial border-[3px] border-black rounded-lg bg-background focus:border-accent-pink"
              disabled={addingInspiration}
            />
            <button
              onClick={handleAddInspiration}
              disabled={!newInspirationUrl.trim() || addingInspiration}
              className="border-[3px] border-black rounded-lg py-2 px-3 bg-black text-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 disabled:opacity-50"
            >
              {addingInspiration ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
