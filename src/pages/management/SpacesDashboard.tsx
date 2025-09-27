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
      title: 'VENUES',
      description: 'Physical spaces & availability',
      icon: Building2,
      href: '/management/spaces/venues',
      stats: 'Manage venues'
    },
    {
      title: 'CALENDAR',
      description: 'Bookings & scheduling',
      icon: Calendar,
      href: '/management/spaces/calendar',
      stats: 'Event calendar'
    },
    {
      title: 'LEADS',
      description: 'Enquiries & sales pipeline',
      icon: Users,
      href: '/management/spaces/leads',
      stats: 'CRM tracking'
    },
  ];

  return (
    <ManagementLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-brutalist text-5xl font-black uppercase tracking-wider text-foreground">SPACES</h1>
          <p className="font-industrial text-muted-foreground">
            Event management system
          </p>
        </div>

        {/* Active Modules */}
        <div>
          <h2 className="font-brutalist text-2xl font-black uppercase tracking-wide text-foreground mb-4">MODULES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <Card key={module.title} className="border-industrial hover:shadow-brutal transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <module.icon className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                    <div>
                      <CardTitle className="font-brutalist text-xl font-black uppercase tracking-wide">{module.title}</CardTitle>
                      <p className="font-industrial text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="font-industrial text-sm text-muted-foreground">{module.stats}</span>
                    <Button asChild className="btn-primary font-brutalist uppercase tracking-wide">
                      <Link to={module.href}>
                        OPEN
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="border-industrial">
          <CardHeader>
            <CardTitle className="font-brutalist uppercase tracking-wide">ACCESS LEVEL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-brutalist font-black uppercase text-foreground">{managementUser?.role}</p>
                <p className="font-industrial text-sm text-muted-foreground">
                  System access granted
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