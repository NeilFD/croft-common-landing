import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Upload, FileText, Download, Link as LinkIcon, Plus, Trash2, FileCheck, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { FramedBox } from '@/components/ui/FramedBox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';

interface ClientPortalManagementViewProps {
  eventId: string;
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
}

interface Contract {
  id: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  client_signature: string | null;
  pdf_url: string | null;
}

export const ClientPortalManagementView = ({ eventId }: ClientPortalManagementViewProps) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [inspirationLinks, setInspirationLinks] = useState<InspirationLink[]>([]);
  const [beo, setBeo] = useState<BEO | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadPortalData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('client-portal-data-management', {
        body: { event_id: eventId },
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
    } catch (error) {
      console.error('[ClientPortalManagementView] Error:', error);
      toast.error('Failed to load client portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [eventId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          event_id: eventId,
          author: 'team',
          body: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent');
      await loadPortalData();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="font-industrial text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-accent-blue/10 border-[3px] border-accent-blue/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent-blue flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-brutalist text-sm uppercase tracking-wide text-accent-blue">Management View</p>
            <p className="font-industrial text-sm text-muted-foreground">
              This is what your client sees in their portal. You can view their messages, files, and respond as the team.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Event Details */}
        <div className="border-[3px] border-black rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">
            Event Details
          </h2>
            
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-[3px] border-black rounded-lg p-0 h-auto mb-6 bg-background">
              <TabsTrigger value="overview" className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1">OVERVIEW</TabsTrigger>
              <TabsTrigger value="documents" className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1">DOCUMENTS</TabsTrigger>
              <TabsTrigger value="contract" className="font-industrial uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-background rounded-lg m-1">CONTRACT</TabsTrigger>
            </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  <div>
                    <p className="font-industrial text-xs uppercase text-muted-foreground">Event Type</p>
                    <p className="font-brutalist text-lg">{event.event_type || 'N/A'}</p>
                  </div>
                  {event.primary_date && (
                    <div>
                      <p className="font-industrial text-xs uppercase text-muted-foreground">Date</p>
                      <p className="font-industrial">{format(new Date(event.primary_date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  )}
                  {event.headcount && (
                    <div>
                      <p className="font-industrial text-xs uppercase text-muted-foreground">Headcount</p>
                      <p className="font-industrial">{event.headcount} guests</p>
                    </div>
                  )}
                </div>
              </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {beo && (
                <div className="border-[3px] border-steel rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5 hover:border-accent-pink">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-brutalist uppercase text-sm">BEO v{beo.version_no}</p>
                        <p className="font-industrial text-xs text-muted-foreground">
                          {format(new Date(beo.generated_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {beo.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={beo.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

              {proposal && (
                <div className="border-[3px] border-steel rounded-lg p-4 bg-background transition-all duration-300 hover:shadow-lg hover:shadow-accent-pink/5 hover:border-accent-pink">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-brutalist uppercase text-sm">Proposal v{proposal.version_no}</p>
                        <p className="font-industrial text-xs text-muted-foreground">
                          {format(new Date(proposal.generated_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {proposal.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={proposal.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

              {!beo && !proposal && (
                <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                  No documents available yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="contract" className="space-y-4">
                {contract ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={contract.status === 'signed' ? 'default' : 'outline'}>
                        {(contract.status || 'pending').toUpperCase()}
                      </Badge>
                      {contract.signed_at && (
                        <p className="font-industrial text-xs text-muted-foreground">
                          Signed {format(new Date(contract.signed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {contract.pdf_url && (
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download Contract
                        </a>
                      </Button>
                    )}
                  </div>
              ) : (
                <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                  No contract available yet
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Messages */}
        <div className="border-[3px] border-charcoal rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">
            Messages
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border-[3px] ${
                  msg.author === 'team'
                    ? 'bg-accent-pink/10 border-accent-pink/20 ml-8'
                    : 'bg-muted border-steel mr-8'
                }`}
              >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-brutalist text-xs uppercase">
                      {msg.author === 'team' ? 'Team' : 'Client'}
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

          <div className="space-y-2 pt-4 border-t-[3px] border-steel">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to the client..."
              className="font-industrial resize-none border-[3px] border-steel rounded-lg bg-background focus:border-charcoal"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="w-full border-[3px] border-charcoal rounded-lg py-3 px-4 font-brutalist uppercase text-sm bg-charcoal text-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 disabled:opacity-50"
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
        <div className="border-[3px] border-charcoal rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Uploaded Files</h2>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border-[3px] border-steel rounded-lg bg-background hover:border-accent-pink hover:shadow-lg hover:shadow-accent-pink/10 transition-all duration-300">
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
                    className="flex-shrink-0 border-[3px] border-charcoal rounded-lg py-2 px-3 bg-background hover:bg-accent-pink hover:border-accent-pink transition-all duration-300 inline-flex items-center"
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
        </div>

        {/* Inspiration */}
        <div className="border-[3px] border-charcoal rounded-lg p-6 bg-background transition-all duration-300 hover:shadow-xl hover:shadow-accent-pink/10 hover:-translate-y-1">
          <h2 className="font-brutalist text-2xl uppercase tracking-wide mb-6 text-foreground">Inspiration Board</h2>
          <div className="space-y-3">
            {inspirationLinks.map((link) => (
              <div key={link.id} className="border-[3px] border-steel rounded-lg p-3 bg-background hover:border-accent-pink hover:shadow-lg hover:shadow-accent-pink/10 transition-all duration-300">
                <div className="flex items-start gap-3">
                  {link.thumbnail_url && (
                    <img 
                      src={link.thumbnail_url} 
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border-[3px] border-steel flex-shrink-0"
                    />
                  )}
                        <div className="flex-1 min-w-0">
                          {link.title && (
                            <p className="font-industrial text-sm font-medium truncate">{link.title}</p>
                          )}
                          {link.description && (
                            <p className="font-industrial text-xs text-muted-foreground line-clamp-2">{link.description}</p>
                          )}
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-industrial text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View Link
                          </a>
                  </div>
                </div>
              </div>
            ))}
            {inspirationLinks.length === 0 && (
              <p className="font-industrial text-sm text-muted-foreground text-center py-8">
                No inspiration links yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
