import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Users, TrendingUp, Database, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [enabledUsersRes, recentNotificationsRes] = await Promise.all([
        supabase.functions.invoke("get-enabled-users-count"),
        supabase.from('notifications')
          .select('id, title, status, created_at, recipients_count')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        enabledUsers: enabledUsersRes.data,
        recentNotifications: recentNotificationsRes.data || []
      };
    },
    refetchInterval: 30000,
  });

  const quickActions = [
    {
      title: 'Compose Notification',
      description: 'Send a new notification to users',
      href: '/admin/notifications/compose',
      icon: Bell,
      variant: 'default' as const,
    },
    {
      title: 'View Analytics',
      description: 'Check user engagement metrics',
      href: '/admin/analytics/users',
      icon: TrendingUp,
      variant: 'outline' as const,
    },
    {
      title: 'Manage Subscribers',
      description: 'View and manage notification subscribers',
      href: '/admin/management/subscribers',
      icon: Users,
      variant: 'outline' as const,
    },
    {
      title: 'Member Database',
      description: 'Access comprehensive member analytics',
      href: '/admin/member-analytics',
      icon: Database,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Croft Common admin interface
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.enabledUsers?.count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with notifications enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.enabledUsers?.devices ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered device endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unknown Endpoints</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.enabledUsers?.unknown_endpoints ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoints not linked to users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Common administrative tasks
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Button 
                  variant={action.variant} 
                  className="w-full h-auto p-4 justify-start"
                >
                  <div className="flex items-start gap-3">
                    <action.icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest notification activity
          </p>
        </CardHeader>
        <CardContent>
          {stats?.recentNotifications?.length ? (
            <div className="space-y-3">
              {stats.recentNotifications.map((notification: any) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()} • 
                      {notification.recipients_count || 0} recipients
                    </p>
                  </div>
                  <Badge variant={
                    notification.status === 'sent' ? 'default' :
                    notification.status === 'sending' ? 'secondary' :
                    notification.status === 'failed' ? 'destructive' :
                    'outline'
                  }>
                    {notification.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent notifications</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};