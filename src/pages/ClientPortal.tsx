import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Send, Upload, FileText, Calendar, Users, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
      const fileName = `${session.eventId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('client_files')
        .insert({
          event_id: session.eventId,
          filename: file.name,
          storage_path: fileName,
          mime_type: file.type,
          size_bytes: file.size
        });

      if (dbError) throw dbError;

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Session Required</h1>
          <p className="text-muted-foreground mb-6">
            Please use the magic link provided to access your event portal.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Event Portal</h1>
            <p className="text-sm text-muted-foreground">{session.contactEmail}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Event Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Event Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(event.primary_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{event.start_time || 'TBC'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-medium">{event.headcount}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="font-medium">{event.event_type}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Messages */}
          <Card className="p-6 flex flex-col h-[600px]">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.author === 'client'
                      ? 'bg-accent-pink text-white ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-xs mt-1 ${
                    msg.author === 'client' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
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
                className="resize-none"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="shrink-0"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Files */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Files</h2>
              <Button variant="outline" size="sm" disabled={uploadingFile} asChild>
                <label className="cursor-pointer">
                  {uploadingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </label>
              </Button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No files uploaded yet
                </p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size_bytes / 1024).toFixed(1)} KB • {format(new Date(file.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
