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
      // Get authenticated user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a chat');
        return;
      }

      // Create group chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'group',
          name: chatName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert({
          chat_id: newChat.id,
          user_id: user.id,
          is_admin: true,
        });

      if (memberError) throw memberError;

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
