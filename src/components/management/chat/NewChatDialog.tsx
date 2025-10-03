import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { toast } from 'sonner';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export const NewChatDialog = ({ open, onOpenChange, onChatCreated }: NewChatDialogProps) => {
  const { managementUser } = useManagementAuth();
  const [chatName, setChatName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!chatName.trim()) {
      toast.error('Please enter a chat name');
      return;
    }

    setCreating(true);
    try {
      // Use the secure RPC function to create chat and add creator as admin
      const { data: newChatId, error } = await supabase
        .rpc('create_group_chat', {
          p_name: chatName.trim()
        });

      if (error) throw error;

      toast.success('Chat created successfully');
      setChatName('');
      onOpenChange(false);
      onChatCreated();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="font-brutalist text-xl font-black uppercase tracking-wide">
            NEW GROUP CHAT
          </DialogTitle>
          <DialogDescription className="font-industrial">
            Create a new group chat. You can invite members after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chat-name" className="font-industrial">
              Chat Name
            </Label>
            <Input
              id="chat-name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g., Marketing Team"
              className="font-industrial mt-1"
              disabled={creating}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="font-brutalist uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !chatName.trim()}
              className="bg-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/90 font-brutalist uppercase"
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
