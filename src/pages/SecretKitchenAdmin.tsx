import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Edit, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessUser {
  id: string;
  name: string;
  email: string;
  business_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UsageRecord {
  id: string;
  email: string;
  accessed_at: string;
  session_id: string;
}

export default function SecretKitchenAdmin() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Admin data states
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', business_name: '' });

  // Check if user is authenticated with proper access
  const isAuthenticated = user?.email === 'neil@cityandsanctuary.com';

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const sendMagicLink = async () => {
    if (email !== 'neil@cityandsanctuary.com') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this area.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/secretkitchenadmin`
        }
      });

      if (error) throw error;

      toast({
        title: "Magic Link Sent",
        description: "Check your email and click the link to sign in."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load access users
      const { data: users, error: usersError } = await supabase
        .from('secret_kitchen_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setAccessUsers(users || []);

      // Load usage records
      const { data: usage, error: usageError } = await supabase
        .from('secret_kitchen_usage')
        .select('*')
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (usageError) throw usageError;
      setUsageRecords(usage || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.business_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('secret_kitchen_access')
        .insert([{
          ...newUser,
          created_by: user?.id
        }]);

      if (error) throw error;

      setNewUser({ name: '', email: '', business_name: '' });
      setShowAddUserDialog(false);
      loadAdminData();
      toast({
        title: "User Added",
        description: `${newUser.name} has been added to the access list.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user. Email might already exist.",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('secret_kitchen_access')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      loadAdminData();
      toast({
        title: "Status Updated",
        description: `User access has been ${!currentStatus ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      const { error } = await supabase
        .from('secret_kitchen_access')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      loadAdminData();
      toast({
        title: "User Deleted",
        description: `${userName} has been removed from the access list.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive"
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Secret Kitchen Admin</CardTitle>
            <p className="text-center text-muted-foreground">
              Restricted access for neil@cityandsanctuary.com
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neil@cityandsanctuary.com"
              />
            </div>
            <Button 
              onClick={sendMagicLink} 
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Secret Kitchen Admin</h1>
            <p className="text-muted-foreground">Manage access to the Secret Kitchen brochure</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accessUsers.filter(u => u.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageRecords.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Access Management</CardTitle>
              <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business">Business Name</Label>
                      <Input
                        id="business"
                        value={newUser.business_name}
                        onChange={(e) => setNewUser({ ...newUser, business_name: e.target.value })}
                        placeholder="Company or organization"
                      />
                    </div>
                    <Button onClick={addUser} className="w-full">
                      Add User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.business_name}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id, user.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Access Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Accessed</TableHead>
                  <TableHead>Session ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.email}</TableCell>
                    <TableCell>
                      {new Date(record.accessed_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.session_id.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}