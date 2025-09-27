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
      <div className="space-y-6 md:space-y-8 p-3 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-brutalist text-3xl md:text-5xl font-black uppercase tracking-wider text-foreground">SPACES</h1>
          <p className="font-industrial text-muted-foreground text-sm md:text-base">
            Event management system
          </p>
        </div>

        {/* Active Modules */}
        <div>
          <h2 className="font-brutalist text-xl md:text-2xl font-black uppercase tracking-wide text-foreground mb-3 md:mb-4">MODULES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {modules.map((module) => (
              <Card key={module.title} className="border-industrial hover:shadow-brutal transition-all">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start space-x-3">
                    <module.icon className="h-6 w-6 md:h-8 md:w-8 text-[hsl(var(--accent-pink))] flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wide leading-tight">{module.title}</CardTitle>
                      <p className="font-industrial text-xs md:text-sm text-muted-foreground mt-1">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="font-industrial text-xs md:text-sm text-muted-foreground">{module.stats}</span>
                    <Button asChild className="btn-primary font-brutalist uppercase tracking-wide h-9 md:h-10 px-4 md:px-6">
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
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-brutalist uppercase tracking-wide text-base md:text-lg">ACCESS LEVEL</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-brutalist font-black uppercase text-foreground text-sm md:text-base">{managementUser?.role}</p>
                <p className="font-industrial text-xs md:text-sm text-muted-foreground">
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