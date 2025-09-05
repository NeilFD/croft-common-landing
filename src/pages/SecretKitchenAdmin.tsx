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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Edit, Users, Activity, Eye, Download, Filter, TrendingUp, Calendar, CheckCircle, FileText, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApplicationDetailsModal } from '@/components/ApplicationDetailsModal';

interface AccessUser {
  id: string;
  name: string;
  email: string;
  business_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  has_applied: boolean;
  application_date: string | null;
  calendly_booked: boolean;
  calendly_booking_date: string | null;
  application_id: string | null;
  first_access_at: string | null;
  access_expires_at: string | null;
  // Application details when joined
  application_business_name?: string;
  application_contact_name?: string;
  phone?: string;
  business_type?: string;
  cuisine_style?: string;
  years_experience?: number;
  team_size?: number;
  daily_covers_target?: number;
  current_location?: string;
  previous_food_hall_experience?: boolean;
  unique_selling_point?: string;
  social_media_handles?: string;
  questions_comments?: string;
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
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Admin data states
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', business_name: '' });
  
  // Enhanced tracking states
  const [selectedApplication, setSelectedApplication] = useState<AccessUser | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredUsers, setFilteredUsers] = useState<AccessUser[]>([]);

  // Check if user is authenticated with proper access
  const isAuthenticated = user?.email === 'neil@cityandsanctuary.com';

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Filter users based on status
  useEffect(() => {
    let filtered = accessUsers;
    
    if (statusFilter === 'applied') {
      filtered = accessUsers.filter(u => u.has_applied);
    } else if (statusFilter === 'not-applied') {
      filtered = accessUsers.filter(u => !u.has_applied);
    } else if (statusFilter === 'meeting-booked') {
      filtered = accessUsers.filter(u => u.calendly_booked);
    }
    
    setFilteredUsers(filtered);
  }, [accessUsers, statusFilter]);

  const sendOtpCode = async () => {
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
          shouldCreateUser: false
        }
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "OTP Code Sent",
        description: "Check your email for a 6-digit verification code."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (error) throw error;

      toast({
        title: "Authentication Successful",
        description: "Welcome to Secret Kitchen Admin."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid or expired code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load enhanced access users with application details
      const { data: users, error: usersError } = await supabase
        .from('secret_kitchen_access')
        .select(`
          *,
          kitchen_vendor_inquiries:application_id (
            business_name,
            contact_name,
            phone,
            business_type,
            cuisine_style,
            years_experience,
            team_size,
            daily_covers_target,
            current_location,
            previous_food_hall_experience,
            unique_selling_point,
            social_media_handles,
            questions_comments
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      // Flatten the joined data
      const enhancedUsers = (users || []).map(user => ({
        ...user,
        application_business_name: user.kitchen_vendor_inquiries?.business_name,
        application_contact_name: user.kitchen_vendor_inquiries?.contact_name,
        phone: user.kitchen_vendor_inquiries?.phone,
        business_type: user.kitchen_vendor_inquiries?.business_type,
        cuisine_style: user.kitchen_vendor_inquiries?.cuisine_style,
        years_experience: user.kitchen_vendor_inquiries?.years_experience,
        team_size: user.kitchen_vendor_inquiries?.team_size,
        daily_covers_target: user.kitchen_vendor_inquiries?.daily_covers_target,
        current_location: user.kitchen_vendor_inquiries?.current_location,
        previous_food_hall_experience: user.kitchen_vendor_inquiries?.previous_food_hall_experience,
        unique_selling_point: user.kitchen_vendor_inquiries?.unique_selling_point,
        social_media_handles: user.kitchen_vendor_inquiries?.social_media_handles,
        questions_comments: user.kitchen_vendor_inquiries?.questions_comments,
      }));
      
      setAccessUsers(enhancedUsers);

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

  const toggleMeetingStatus = async (userEmail: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('update_meeting_status', {
        user_email: userEmail,
        booking_status: !currentStatus,
        booking_date: !currentStatus ? new Date().toISOString() : null
      });

      if (error) throw error;

      loadAdminData();
      toast({
        title: "Meeting Status Updated",
        description: `Meeting status has been ${!currentStatus ? 'marked as booked' : 'cleared'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meeting status.",
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

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Business Name', 'Status', 'Has Applied', 'Application Date',
      'Meeting Booked', 'Meeting Date', 'Business Type', 'Cuisine Style',
      'Years Experience', 'Team Size', 'Daily Covers Target', 'Current Location',
      'Food Hall Experience', 'Unique Selling Point', 'Social Media', 'Questions/Comments'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        `"${user.name}"`,
        `"${user.email}"`,
        `"${user.business_name}"`,
        `"${user.is_active ? 'Active' : 'Inactive'}"`,
        `"${user.has_applied ? 'Yes' : 'No'}"`,
        `"${user.application_date ? new Date(user.application_date).toLocaleDateString() : 'N/A'}"`,
        `"${user.calendly_booked ? 'Yes' : 'No'}"`,
        `"${user.calendly_booking_date ? new Date(user.calendly_booking_date).toLocaleDateString() : 'N/A'}"`,
        `"${user.business_type || 'N/A'}"`,
        `"${user.cuisine_style || 'N/A'}"`,
        `"${user.years_experience || 'N/A'}"`,
        `"${user.team_size || 'N/A'}"`,
        `"${user.daily_covers_target || 'N/A'}"`,
        `"${user.current_location || 'N/A'}"`,
        `"${user.previous_food_hall_experience ? 'Yes' : 'No'}"`,
        `"${user.unique_selling_point?.replace(/"/g, '""') || 'N/A'}"`,
        `"${user.social_media_handles?.replace(/"/g, '""') || 'N/A'}"`,
        `"${user.questions_comments?.replace(/"/g, '""') || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `secret-kitchen-applications-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "CSV file has been downloaded."
    });
  };

  const viewApplicationDetails = (user: AccessUser) => {
    setSelectedApplication(user);
    setShowApplicationModal(true);
  };

  const getApplicationStatus = (user: AccessUser) => {
    if (user.calendly_booked) return { text: "Meeting Booked", variant: "default" as const };
    if (user.has_applied) return { text: "Applied", variant: "secondary" as const };
    return { text: "Not Applied", variant: "outline" as const };
  };

  const getAccessExpiryStatus = (user: AccessUser) => {
    if (!user.access_expires_at) {
      return { text: "No Timer Set", variant: "secondary" as const, timeLeft: null, urgent: false };
    }

    const now = new Date();
    const expiryTime = new Date(user.access_expires_at);
    const timeLeft = expiryTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (timeLeft <= 0) {
      return { text: "Expired", variant: "destructive" as const, timeLeft: null, urgent: true };
    } else if (hoursLeft <= 1) {
      return { 
        text: `${minutesLeft}m left`, 
        variant: "destructive" as const, 
        timeLeft: `${minutesLeft} minutes`,
        urgent: true
      };
    } else if (hoursLeft <= 2) {
      return { 
        text: `${hoursLeft}h ${minutesLeft}m left`, 
        variant: "destructive" as const, 
        timeLeft: `${hoursLeft} hours ${minutesLeft} minutes`,
        urgent: true
      };
    } else if (hoursLeft <= 6) {
      return { 
        text: `${hoursLeft}h left`, 
        variant: "default" as const, 
        timeLeft: `${hoursLeft} hours`,
        urgent: false
      };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      const remainingHours = hoursLeft % 24;
      return { 
        text: daysLeft > 0 ? `${daysLeft}d ${remainingHours}h` : `${hoursLeft}h left`, 
        variant: "secondary" as const, 
        timeLeft: daysLeft > 0 ? `${daysLeft} days ${remainingHours} hours` : `${hoursLeft} hours`,
        urgent: false
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setOtpCode('');
    setOtpSent(false);
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
  };

  // Calculate conversion metrics
  const totalUsers = accessUsers.length;
  const activeUsers = accessUsers.filter(u => u.is_active).length;
  const appliedUsers = accessUsers.filter(u => u.has_applied).length;
  const meetingBookedUsers = accessUsers.filter(u => u.calendly_booked).length;
  const applicationRate = totalUsers > 0 ? Math.round((appliedUsers / totalUsers) * 100) : 0;
  const meetingRate = appliedUsers > 0 ? Math.round((meetingBookedUsers / appliedUsers) * 100) : 0;

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
                disabled={otpSent}
              />
            </div>
            
            {!otpSent ? (
              <Button 
                onClick={sendOtpCode} 
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send OTP Code'}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={verifyOtpCode} 
                    disabled={loading || !otpCode || otpCode.length !== 6}
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }} 
                    variant="outline"
                    className="w-full"
                  >
                    Back to Email
                  </Button>
                </div>
              </>
            )}
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
            <p className="text-muted-foreground">Manage access to the Secret Kitchen brochure and track applications</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Access</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appliedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {applicationRate}% conversion
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetingBookedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {meetingRate}% of applications
              </p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funnel</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div>Access → Apply: {applicationRate}%</div>
                <div>Apply → Meet: {meetingRate}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Applicant Tracking & Management</CardTitle>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="not-applied">Not Applied</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="meeting-booked">Meeting Booked</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
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
                  <TableHead>Application</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Access Expires</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const appStatus = getApplicationStatus(user);
                  const expiryStatus = getAccessExpiryStatus(user);
                  return (
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
                        <Badge variant={appStatus.variant}>
                          {user.has_applied ? "Applied" : "Not Applied"}
                        </Badge>
                        {user.application_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(user.application_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.calendly_booked ? "default" : "outline"}>
                          {user.calendly_booked ? "Booked" : "No Meeting"}
                        </Badge>
                        {user.calendly_booking_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(user.calendly_booking_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expiryStatus.urgent && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <Badge variant={expiryStatus.variant} className="mb-1">
                              {expiryStatus.text}
                            </Badge>
                            {user.access_expires_at && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(user.access_expires_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
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
                          {user.has_applied && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewApplicationDetails(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
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
                  );
                })}
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

        {/* Application Details Modal */}
        <ApplicationDetailsModal
          application={selectedApplication}
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedApplication(null);
          }}
          onToggleMeeting={toggleMeetingStatus}
        />
      </div>
    </div>
  );
}