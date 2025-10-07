import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Send, Upload, FileText, Calendar, Users, Clock, Mail } from 'lucide-react';
import { FramedBox } from '@/components/ui/FramedBox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CroftLogo from '@/components/CroftLogo';
import { BRAND_NAME } from '@/data/brand';

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
}

const ClientPortal = () => {
  const { eventCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('client_session_id');
    const csrfToken = sessionStorage.getItem('client_csrf_token');
    const eventId = sessionStorage.getItem('client_event_id');
    
    console.log('[ClientPortal] Session data:', { sessionId, csrfToken, eventId });
    
    if (!sessionId || !csrfToken || !eventId) {
      console.warn('[ClientPortal] Missing required session data');
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        // Fetch all portal data via secure edge function
        const { data, error } = await supabase.functions.invoke('client-portal-data', {
          body: {
            session_id: sessionId,
            csrf_token: csrfToken,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to load portal data');

        console.log('[ClientPortal] Portal data loaded:', data);

        setEvent(data.event as Event);
        setMessages(data.messages as Message[]);
        setFiles(data.files as ClientFile[]);
        
        setSession({
          sessionId,
          csrfToken,
          eventId: data.event.id,
          contactEmail: data.event.client_email || '',
        });

        setLoading(false);
      } catch (error) {
        console.error('[ClientPortal] Session init error:', error);
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
      
      // Reload all portal data to get updated messages
      const { data: portalData, error: portalError } = await supabase.functions.invoke('client-portal-data', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
        },
      });

      if (!portalError && portalData.success) {
        setMessages(portalData.messages as Message[]);
      }
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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('session_id', session.sessionId);
      formData.append('csrf_token', session.csrfToken);
      formData.append('file', file);

      // Upload via edge function with service role access
      const { data, error } = await supabase.functions.invoke('client-upload-file', {
        body: formData,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to upload file');

      // Reload portal data to get updated file list
      const { data: portalData, error: portalError } = await supabase.functions.invoke('client-portal-data', {
        body: {
          session_id: session.sessionId,
          csrf_token: session.csrfToken,
        },
      });

      if (!portalError && portalData.success) {
        setFiles(portalData.files as ClientFile[]);
      }

      toast.success('File uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('client_session_id');
    sessionStorage.removeItem('client_csrf_token');
    sessionStorage.removeItem('client_event_id');
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

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Event Details */}
        <div className="border-2 border-charcoal p-6 bg-transparent">
          <h2 className="font-brutalist text-xl uppercase tracking-wide mb-6 text-foreground">Event Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-steel mt-0.5" />
                <div>
                  <p className="font-industrial text-xs uppercase text-steel mb-1">Date</p>
                  <p className="font-industrial font-medium text-foreground">
                    {format(new Date(event.primary_date), 'EEEE, MMMM d, yyyy')}
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
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-steel mt-0.5" />
                <div>
                  <p className="font-industrial text-xs uppercase text-steel mb-1">Guests</p>
                  <p className="font-industrial font-medium text-foreground">{event.headcount}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-steel mt-0.5" />
                <div>
                  <p className="font-industrial text-xs uppercase text-steel mb-1">Event Type</p>
                  <p className="font-industrial font-medium text-foreground">{event.event_type}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Messages */}
          <div className="border-2 border-charcoal p-6 flex flex-col h-[600px] bg-transparent">
            <h2 className="font-brutalist text-xl uppercase tracking-wide mb-4 text-foreground">Messages</h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.author === 'client' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      msg.author === 'client'
                        ? 'bg-accent-pink text-background max-w-[70%]'
                        : 'bg-concrete text-foreground max-w-[75%]'
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

          {/* Files */}
          <div className="border-2 border-charcoal p-6 bg-transparent">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-brutalist text-xl uppercase tracking-wide text-foreground">Files</h2>
              <FramedBox
                as="label"
                size="sm"
                className={`cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 inline" />
                    Upload
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </FramedBox>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
