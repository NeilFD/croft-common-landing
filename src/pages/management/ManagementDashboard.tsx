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
      title: 'SPACES',
      description: 'Event management system',
      icon: Building2,
      href: '/management/spaces',
      color: 'text-[hsl(var(--accent-pink))]'
    }
  ];

  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-brutalist text-4xl font-black uppercase tracking-wider">MANAGEMENT</h1>
          <p className="font-industrial text-muted-foreground mt-2">
            {managementUser?.user.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="border-industrial hover:shadow-brutal transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <CardTitle className="font-brutalist text-xl font-black uppercase tracking-wide">{action.title}</CardTitle>
                </div>
                <CardDescription className="font-industrial">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full btn-primary font-brutalist uppercase tracking-wide">
          <Link to="/management/spaces" className="flex items-center space-x-2">
            <Building2 className="mr-2 h-4 w-4" />
            <span>OPEN</span>
          </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-industrial">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-brutalist uppercase tracking-wide">
              <BarChart3 className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              <span>ACCESS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-industrial text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="capitalize font-medium text-foreground">{managementUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-medium text-foreground">
                  {managementUser?.role === 'admin' ? 'Full' : 
                   managementUser?.role === 'sales' ? 'Sales & Ops' :
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