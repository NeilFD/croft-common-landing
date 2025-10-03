import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserMinus, UserPlus, LogOut, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface GroupSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  onChatUpdated: () => void;
  onChatDeleted: () => void;
}

interface ChatMember {
  id: string;
  user_id: string;
  is_admin: boolean;
  joined_at: string;
  user_name?: string;
  user_role?: string;
}

export const GroupSettingsDialog = ({
  isOpen,
  onClose,
  chatId,
  chatName,
  onChatUpdated,
  onChatDeleted,
}: GroupSettingsDialogProps) => {
  const [newName, setNewName] = useState(chatName);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, chatId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Load members
    const { data: membersData, error: membersError } = await supabase
      .from('chat_members')
      .select('*')
      .eq('chat_id', chatId);

    if (membersError) {
      toast({ title: 'Error loading members', variant: 'destructive' });
      return;
    }

    // Enrich with user info
    const enrichedMembers = await Promise.all(
      (membersData || []).map(async (member) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', member.user_id)
          .single();

        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(member.user_id);

        return {
          ...member,
          user_name: authUser?.email?.split('@')[0] || 'Unknown',
          user_role: roleData?.role || 'unknown',
        };
      })
    );

    setMembers(enrichedMembers);

    // Check if current user is admin
    const currentMember = enrichedMembers.find((m) => m.user_id === user.id);
    setIsAdmin(currentMember?.is_admin || false);

    // Load all users (only if admin)
    if (currentMember?.is_admin) {
      const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');

      if (rolesData) {
        const usersWithRoles = await Promise.all(
          rolesData.map(async (role) => {
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(role.user_id);
            return {
              id: role.user_id,
              email: authUser?.email || 'Unknown',
              role: role.role,
            };
          })
        );
        setAllUsers(usersWithRoles.filter((u) => !members.find((m) => m.user_id === u.id)));
      }
    }
  };

  const handleRename = async () => {
    if (!isAdmin) {
      toast({ title: 'Only admins can rename chats', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('chats')
      .update({ name: newName })
      .eq('id', chatId);

    setLoading(false);

    if (error) {
      toast({ title: 'Error renaming chat', variant: 'destructive' });
    } else {
      toast({ title: 'Chat renamed successfully' });
      onChatUpdated();
    }
  };

  const handleAddMember = async () => {
    if (!isAdmin || !selectedUserId) return;

    setLoading(true);
    const { error } = await supabase.from('chat_members').insert({
      chat_id: chatId,
      user_id: selectedUserId,
      is_admin: false,
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Error adding member', variant: 'destructive' });
    } else {
      toast({ title: 'Member added successfully' });
      setSelectedUserId('');
      loadData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) {
      toast({ title: 'Only admins can remove members', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('chat_members').delete().eq('id', memberId);

    setLoading(false);

    if (error) {
      toast({ title: 'Error removing member', variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      loadData();
    }
  };

  const handleLeaveChat = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', currentUserId);

    setLoading(false);

    if (error) {
      toast({ title: 'Error leaving chat', variant: 'destructive' });
    } else {
      toast({ title: 'Left chat' });
      onClose();
      onChatDeleted();
    }
  };

  const handleDeleteChat = async () => {
    if (!isAdmin) {
      toast({ title: 'Only admins can delete chats', variant: 'destructive' });
      return;
    }

    if (!confirm('Are you sure you want to delete this chat? This cannot be undone.')) return;

    setLoading(true);
    const { error } = await supabase.from('chats').delete().eq('id', chatId);

    setLoading(false);

    if (error) {
      toast({ title: 'Error deleting chat', variant: 'destructive' });
    } else {
      toast({ title: 'Chat deleted' });
      onClose();
      onChatDeleted();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-brutalist">Group Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rename Section */}
          <div>
            <Label htmlFor="chat-name" className="font-industrial text-sm">
              Chat Name
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="chat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={!isAdmin || loading}
                className="font-industrial"
              />
              <Button
                onClick={handleRename}
                disabled={!isAdmin || loading || newName === chatName}
                size="sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rename'}
              </Button>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <Label className="font-industrial text-sm">Members ({members.length})</Label>
            <ScrollArea className="h-[200px] mt-2 border rounded-md p-2">
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.user_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-industrial text-sm">{member.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.user_role} {member.is_admin && '• Admin'}
                        </p>
                      </div>
                    </div>
                    {isAdmin && member.user_id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={loading}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Add Member Section (Admin Only) */}
          {isAdmin && allUsers.length > 0 && (
            <div>
              <Label className="font-industrial text-sm">Add Member</Label>
              <div className="flex gap-2 mt-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  <option value="">Select a user...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddMember} disabled={!selectedUserId || loading} size="sm">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleLeaveChat}
              disabled={loading}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Chat
            </Button>

            {isAdmin && (
              <Button
                variant="destructive"
                onClick={handleDeleteChat}
                disabled={loading}
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
