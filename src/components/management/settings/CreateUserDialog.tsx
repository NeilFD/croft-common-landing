import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export const CreateUserDialog = ({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<'Manager' | 'Admin'>('Manager');
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast({
        title: 'Error',
        description: 'User name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive'
      });
      return;
    }

    if (!jobTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Job title is required',
        variant: 'destructive'
      });
      return;
    }


    try {
      setLoading(true);

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-management-user', {
        body: { 
          user_name: userName.trim(),
          email: email.trim(),
          job_title: jobTitle.trim(),
          role 
        }
      });

      if (error) throw error;

      setTempPassword(data.temp_password);
      
      toast({
        title: 'User created',
        description: `${userName} has been created with ${role} access`
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied',
      description: 'Temporary password copied to clipboard'
    });
  };

  const handleClose = () => {
    setUserName('');
    setEmail('');
    setJobTitle('');
    setRole('Manager');
    setTempPassword('');
    setCopied(false);
    onOpenChange(false);
    if (tempPassword) {
      onUserCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Management User</DialogTitle>
          <DialogDescription>
            {tempPassword
              ? 'Save this password - it will only be shown once'
              : 'Create a new user with access to the management portal'}
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="font-mono text-sm p-2 bg-muted rounded">
                {email}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-lg p-3 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-500 rounded">
                  {tempPassword}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-500 rounded text-sm">
              <strong>Important:</strong> The user will be required to change this password on first login.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="John Smith"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Enter as: [first name] [surname]</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  type="text"
                  placeholder="e.g. Sales Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as 'Manager' | 'Admin')} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {tempPassword && (
          <DialogFooter>
            <Button onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
