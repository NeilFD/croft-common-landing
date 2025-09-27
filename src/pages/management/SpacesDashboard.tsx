import { Link } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Calendar, BarChart3 } from 'lucide-react';

const SpacesDashboard = () => {
  const { managementUser } = useManagementAuth();

  const modules = [
    {
      title: 'Venue Management',
      description: 'Manage physical spaces, capacities, and availability',
      icon: Building2,
      href: '/management/spaces/venues',
      stats: 'Manage all venue spaces'
    },
    {
      title: 'Leads & Sales',
      description: 'Track enquiries and manage your sales pipeline',
      icon: Users,
      href: '/management/spaces/leads',
      stats: 'CRM and lead tracking'
    },
  ];

  const upcomingModules = [
    {
      title: 'Event Management',
      description: 'Coordinate bookings and event logistics',
      icon: Calendar,
      comingSoon: true
    },
    {
      title: 'Analytics & Reports',
      description: 'Performance insights and business intelligence',
      icon: BarChart3,
      comingSoon: true
    }
  ];

  return (
    <ManagementLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Spaces</h1>
          <p className="text-muted-foreground">
            Complete event management system for {managementUser?.role || 'your'} operations
          </p>
        </div>

        {/* Active Modules */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Available Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <Card key={module.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <module.icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{module.stats}</span>
                    <Button asChild>
                      <Link to={module.href}>
                        Open {module.title}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coming Soon Modules */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingModules.map((module) => (
              <Card key={module.title} className="opacity-75 border-dashed">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <module.icon className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg text-muted-foreground">{module.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Development in progress</span>
                    <Button disabled variant="outline">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Access Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground capitalize">{managementUser?.role}</p>
                <p className="text-sm text-muted-foreground">
                  Access to event management system modules
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
};

export default SpacesDashboard;