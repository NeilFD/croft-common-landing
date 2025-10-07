import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Send, Upload, FileText, Calendar, Users, Clock, Mail, Download, Link as LinkIcon, Plus, Trash2, FileCheck, CheckCircle, AlertCircle, DollarSign, Info } from 'lucide-react';
import { FramedBox } from '@/components/ui/FramedBox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CroftLogo from '@/components/CroftLogo';
import { BRAND_NAME } from '@/data/brand';
import SignatureCanvas from 'react-signature-canvas';

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
  version_number: number;
  created_at: string;
  pdf_url: string | null;
}

interface Proposal {
  id: string;
  version_number: number;
  status: string;
  created_at: string;
  pdf_url: string | null;
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
  
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newInspirationUrl, setNewInspirationUrl] = useState('');
  const [addingInspiration, setAddingInspiration] = useState(false);
  const [signingContract, setSigningContract] = useState(false);
  
  const signatureRef = useRef<SignatureCanvas>(null);

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
      const { error } = await supabase
        .from('client_inspiration_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

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
        <div className="max-w-md w-full border-2 border-charcoal p-8 text-center bg-transparent">
          <h1 className="font-brutalist text-2xl uppercase mb-4 text-foreground">Session Required</h1>
          <p className="font-industrial text-steel mb-6">
            Please use the magic link provided to access your event portal.
          </p>
          <FramedBox
            as="button"
            onClick={() => navigate('/')}
            className="w-full cursor-pointer"
          >
            Return Home
          </FramedBox>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b-2 border-charcoal bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CroftLogo size="lg" />
            <div>
              <h1 className="font-brutalist text-xl uppercase tracking-wide text-foreground">{BRAND_NAME}</h1>
              <p className="font-industrial text-xs text-steel mt-0.5">Event Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-industrial text-sm text-steel mb-2">{session.contactEmail}</p>
            <FramedBox
              as="button"
              onClick={handleLogout}
              size="sm"
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2 inline" />
              Logout
            </FramedBox>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Event Details Card with Tabs */}
          <div className="border-[3px] border-charcoal rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
            <h2 className="font-brutalist text-xl uppercase tracking-wide mb-6 text-foreground">Event Details</h2>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full border-2 border-charcoal bg-transparent p-0 h-auto mb-6">
                  <TabsTrigger 
                    value="overview" 
                    className="flex-1 font-industrial uppercase text-xs data-[state=active]:bg-charcoal data-[state=active]:text-background border-0 rounded-none py-2"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className="flex-1 font-industrial uppercase text-xs data-[state=active]:bg-charcoal data-[state=active]:text-background border-0 rounded-none py-2"
                  >
                    Documents
                  </TabsTrigger>
                  {contract && (
                    <TabsTrigger 
                      value="contract" 
                      className="flex-1 font-industrial uppercase text-xs data-[state=active]:bg-charcoal data-[state=active]:text-background border-0 rounded-none py-2"
                    >
                      Contract
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-steel mt-0.5" />
                        <div>
                          <p className="font-industrial text-xs uppercase text-steel mb-1">Date</p>
                          <p className="font-industrial font-medium text-foreground">
                            {format(new Date(event.primary_date!), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
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
                    <div className="pt-4 border-t-2 border-steel">
                      <p className="font-industrial text-xs uppercase text-steel mb-2">Notes</p>
                      <p className="font-industrial text-sm text-foreground whitespace-pre-wrap">{event.notes}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  {proposal && (
                    <div className="border-[3px] border-steel rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-5 h-5 text-steel mt-0.5" />
                          <div>
                            <p className="font-industrial font-medium text-foreground">Proposal v{proposal.version_number}</p>
                            <p className="font-industrial text-xs text-steel mt-1">
                              Created {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                            </p>
                            <div className="mt-2">
                              <span className={`inline-block px-2 py-1 text-xs font-industrial uppercase border-2 ${
                                proposal.status === 'approved' ? 'border-green-600 text-green-600' :
                                proposal.status === 'pending' ? 'border-yellow-600 text-yellow-600' :
                                'border-steel text-steel'
                              }`}>
                                {proposal.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        {proposal.pdf_url && (
                          <FramedBox
                            as="a"
                            href={proposal.pdf_url}
                            target="_blank"
                            size="sm"
                            className="cursor-pointer shrink-0"
                          >
                            <Download className="w-4 h-4 mr-2 inline" />
                            Download
                          </FramedBox>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {beo && (
                    <div className="border-[3px] border-steel rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <FileCheck className="w-5 h-5 text-steel mt-0.5" />
                          <div>
                            <p className="font-industrial font-medium text-foreground">Banquet Event Order v{beo.version_number}</p>
                            <p className="font-industrial text-xs text-steel mt-1">
                              Created {format(new Date(beo.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {beo.pdf_url && (
                          <FramedBox
                            as="a"
                            href={beo.pdf_url}
                            target="_blank"
                            size="sm"
                            className="cursor-pointer shrink-0"
                          >
                            <Download className="w-4 h-4 mr-2 inline" />
                            Download
                          </FramedBox>
                        )}
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
                  <TabsContent value="contract" className="space-y-4">
                    <div className="border-2 border-steel p-4 bg-transparent">
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

                      {contract.pdf_url && (
                        <FramedBox
                          as="a"
                          href={contract.pdf_url}
                          target="_blank"
                          size="sm"
                          className="cursor-pointer w-full mb-4"
                        >
                          <Download className="w-4 h-4 mr-2 inline" />
                          View Contract PDF
                        </FramedBox>
                      )}

                      {contract.status !== 'signed' && (
                        <div className="mt-6 pt-6 border-t-2 border-steel">
                          <p className="font-industrial text-sm text-foreground mb-4">
                            Please sign below to accept the contract terms
                          </p>
                          <div className="border-2 border-charcoal bg-background p-2 mb-4">
                            <SignatureCanvas
                              ref={signatureRef}
                              canvasProps={{
                                className: 'w-full h-40',
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <FramedBox
                              as="button"
                              onClick={() => signatureRef.current?.clear()}
                              size="sm"
                              className="cursor-pointer"
                            >
                              Clear
                            </FramedBox>
                            <FramedBox
                              as="button"
                              onClick={handleSignContract}
                              disabled={signingContract}
                              size="sm"
                              className="cursor-pointer flex-1 disabled:opacity-50"
                            >
                              {signingContract ? (
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                              ) : (
                                <FileCheck className="w-4 h-4 inline mr-2" />
                              )}
                              Sign Contract
                            </FramedBox>
                          </div>
                        </div>
                      )}

                      {contract.status === 'signed' && contract.client_signature && (
                        <div className="mt-6 pt-6 border-t-2 border-steel">
                          <p className="font-industrial text-xs uppercase text-steel mb-2">Your Signature</p>
                          <img src={contract.client_signature} alt="Signature" className="border-2 border-charcoal p-2 bg-background max-w-full h-40 object-contain" />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Messages */}
            <div className="border-2 border-charcoal p-6 flex flex-col h-[600px] bg-transparent">
              <h2 className="font-brutalist text-xl uppercase tracking-wide mb-4 text-foreground">Messages</h2>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.author === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-3 rounded-none border-2 ${
                        msg.author === 'client'
                          ? 'bg-accent-pink text-background border-accent-pink max-w-[70%]'
                          : 'bg-transparent text-foreground border-charcoal max-w-[75%]'
                      }`}
                    >
                      <p className="font-industrial text-sm whitespace-pre-wrap">{msg.body}</p>
                      <p className={`font-industrial text-xs mt-1 ${
                        msg.author === 'client' ? 'text-background/70' : 'text-steel'
                      }`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="resize-none border-2 border-charcoal bg-transparent font-industrial focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-accent-pink"
                  rows={3}
                />
                <FramedBox
                  as="button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </FramedBox>
              </div>
            </div>
          </div>

          {/* Right Column - Files & Inspiration */}
          <div className="space-y-6">
            <div className="border-2 border-charcoal p-6 bg-transparent">
              <Tabs defaultValue="files" className="w-full">
                <TabsList className="w-full border-2 border-charcoal bg-transparent p-0 h-auto mb-6">
                  <TabsTrigger 
                    value="files" 
                    className="flex-1 font-industrial uppercase text-xs data-[state=active]:bg-charcoal data-[state=active]:text-background border-0 rounded-none py-2"
                  >
                    Files
                  </TabsTrigger>
                  <TabsTrigger 
                    value="inspiration" 
                    className="flex-1 font-industrial uppercase text-xs data-[state=active]:bg-charcoal data-[state=active]:text-background border-0 rounded-none py-2"
                  >
                    Inspiration
                  </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4">
                  <FramedBox
                    as="label"
                    size="sm"
                    className={`w-full cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2 inline" />
                    )}
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </FramedBox>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {files.length === 0 ? (
                      <p className="font-industrial text-sm text-steel text-center py-8">
                        No files uploaded yet
                      </p>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 border-2 border-steel bg-transparent hover:border-accent-pink transition-colors"
                        >
                          <FileText className="w-5 h-5 text-steel shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-industrial font-medium truncate text-foreground">{file.filename}</p>
                            <p className="font-industrial text-xs text-steel">
                              {(file.size_bytes / 1024).toFixed(1)} KB • {format(new Date(file.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Inspiration Tab */}
                <TabsContent value="inspiration" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste inspiration link..."
                      value={newInspirationUrl}
                      onChange={(e) => setNewInspirationUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInspiration();
                        }
                      }}
                      className="border-2 border-charcoal bg-transparent font-industrial focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-accent-pink"
                    />
                    <FramedBox
                      as="button"
                      onClick={handleAddInspiration}
                      disabled={!newInspirationUrl.trim() || addingInspiration}
                      size="sm"
                      className="shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {addingInspiration ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </FramedBox>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {inspirationLinks.length === 0 ? (
                      <p className="font-industrial text-sm text-steel text-center py-8">
                        No inspiration links yet
                      </p>
                    ) : (
                      inspirationLinks.map((link) => (
                        <div
                          key={link.id}
                          className="border-2 border-steel p-3 bg-transparent hover:border-accent-pink transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <LinkIcon className="w-5 h-5 text-steel shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-industrial font-medium text-foreground text-sm mb-1">
                                {link.title || 'Link'}
                              </p>
                              {link.description && (
                                <p className="font-industrial text-xs text-steel mb-2">{link.description}</p>
                              )}
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-industrial text-xs text-accent-pink hover:underline break-all"
                              >
                                {link.url}
                              </a>
                            </div>
                            <button
                              onClick={() => handleDeleteInspiration(link.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;