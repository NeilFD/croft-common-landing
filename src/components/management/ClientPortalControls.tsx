import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link2, Copy, Loader2, ShieldOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientPortalControlsProps {
  eventId: string;
  eventCode: string;
}

const ClientPortalControls = ({ eventId, eventCode }: ClientPortalControlsProps) => {
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [magicLink, setMagicLink] = useState<string>('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const generateMagicLink = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('issue-client-magic-link', {
        body: { event_id: eventId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate link');
      }

      setMagicLink(data.portal_url);
      setShowLinkDialog(true);
      toast.success('Magic link generated');
    } catch (err: any) {
      console.error('Generate link error:', err);
      toast.error(err.message || 'Failed to generate magic link');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    toast.success('Link copied to clipboard');
  };

  const revokeAllSessions = async () => {
    setRevoking(true);
    try {
      const { data, error } = await supabase.functions.invoke('revoke-all-client-sessions', {
        body: { event_id: eventId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to revoke sessions');
      }

      setShowRevokeDialog(false);
      toast.success(`Revoked ${data.sessionsRevoked} session(s) and access link`);
    } catch (err: any) {
      console.error('Revoke error:', err);
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Client Portal Access</h3>
        <div className="space-y-3">
          <Button
            onClick={generateMagicLink}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Generate Magic Link
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setShowRevokeDialog(true)}
            variant="ghost"
            className="w-full bg-accent-pink hover:bg-accent-pink-hover text-white"
          >
            <ShieldOff className="w-4 h-4 mr-2" />
            Revoke All Access
          </Button>
        </div>
      </Card>

      {/* Magic Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Portal Magic Link</DialogTitle>
            <DialogDescription>
              Share this secure link with your client. It expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
              {magicLink}
            </div>
            
            <Button onClick={copyToClipboard} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>

            <div className="bg-accent-pink-subtle p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Security Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Link is single-use for initial login</li>
                <li>• Creates 30-day persistent session</li>
                <li>• Can be revoked at any time</li>
                <li>• Session expires after 30 days of inactivity</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowLinkDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke All Client Access?</DialogTitle>
            <DialogDescription>
              This will immediately revoke all active client sessions and invalidate the magic link for this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm font-semibold text-destructive mb-2">Warning:</p>
            <ul className="text-sm text-destructive space-y-1">
              <li>• All active sessions will be terminated</li>
              <li>• Current magic link will be invalidated</li>
              <li>• Client will need a new link to access portal</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={revokeAllSessions}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke All Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientPortalControls;
