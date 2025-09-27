import { ManagementLayout } from '@/components/management/ManagementLayout';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ManagementDashboard = () => {
  const { managementUser } = useManagementAuth();

  const quickActions = [
    {
      title: 'Spaces',
      description: 'View and manage venue spaces, capacities, and availability',
      icon: Building2,
      href: '/management/spaces',
      color: 'text-[hsl(var(--accent-pink))]'
    }
  ];

  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Management Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {managementUser?.user.email}. Manage your venue operations from here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={action.href}>
                    Open Spaces
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="capitalize font-medium">{managementUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Level:</span>
                <span className="font-medium">
                  {managementUser?.role === 'admin' ? 'Full Access' : 
                   managementUser?.role === 'sales' ? 'Sales & Operations' :
                   'Read Only'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
};

export default ManagementDashboard;