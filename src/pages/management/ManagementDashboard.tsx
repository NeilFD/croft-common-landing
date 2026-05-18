import { ManagementLayout } from '@/components/management/ManagementLayout';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  BarChart3,
  Shield,
  Layout,
  MessageSquare,
  Settings as SettingsIcon,
  CalendarDays,
  Calendar,
  Users,
  Camera,
  Bell,
  TrendingUp,
  UserCheck,
  Home,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PushDiagnostics } from '@/components/PushDiagnostics';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface SubLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModuleCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  show: boolean;
  children?: SubLink[];
}

const ManagementDashboard = () => {
  const { managementUser } = useManagementAuth();
  const { canAccessAdmin, canAccessCMS, canAccessFeedback } = useRoleBasedAccess();
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const allQuickActions: ModuleCard[] = [
    {
      title: 'SPACES',
      description: 'Bookings, venues, events',
      icon: Building2,
      href: '/management/spaces',
      show: true,
      children: [
        { name: 'Venues', href: '/management/spaces/venues', icon: Building2 },
        { name: 'Calendar', href: '/management/spaces/calendar', icon: Calendar },
        { name: 'Events', href: '/management/events', icon: CalendarDays },
        { name: 'Leads & Sales', href: '/management/spaces/leads', icon: Users },
      ],
    },
    {
      title: 'MARKETING',
      description: 'Calendar, programme, campaigns, assets',
      icon: CalendarDays,
      href: '/management/marketing/calendar',
      show: canAccessCMS(),
      children: [
        { name: 'Calendar', href: '/management/marketing/calendar', icon: CalendarDays },
        { name: 'Programme', href: '/management/marketing/programme', icon: BarChart3 },
        { name: 'Campaigns', href: '/management/marketing/campaigns', icon: BarChart3 },
        { name: 'Assets', href: '/management/marketing/assets', icon: Camera },
      ],
    },
    {
      title: 'CMS',
      description: 'Crazy Bear site content',
      icon: Layout,
      href: '/management/cms',
      show: canAccessCMS(),
    },
    {
      title: 'FEEDBACK',
      description: 'Guest feedback',
      icon: MessageSquare,
      href: '/management/feedback',
      show: canAccessFeedback(),
    },
    {
      title: 'SEO',
      description: 'Search performance & meta',
      icon: BarChart3,
      href: '/management/seo',
      show: canAccessCMS(),
    },
    {
      title: 'ADMIN',
      description: 'System administration',
      icon: Shield,
      href: '/management/admin',
      show: canAccessAdmin(),
      children: [
        { name: 'Overview', href: '/management/admin', icon: Home },
        { name: 'Notifications', href: '/management/admin/notifications/compose', icon: Bell },
        { name: 'Analytics', href: '/management/admin/analytics/opt-in', icon: TrendingUp },
        { name: 'Management', href: '/management/admin/management/subscribers', icon: UserCheck },
      ],
    },
    {
      title: 'SETTINGS',
      description: 'Account & push controls',
      icon: SettingsIcon,
      href: '/management/settings',
      show: true,
    },
  ];

  const quickActions = allQuickActions.filter((action) => action.show);

  return (
    <ManagementLayout>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
        <div>
          <h1 className="font-display uppercase tracking-tight text-2xl md:text-4xl font-black tracking-wider">
            MANAGEMENT
          </h1>
          <p className="font-cb-sans text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {managementUser?.user.email}
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="border-industrial flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3 p-4 md:p-6">
                <Link to={action.href} className="block group">
                  <div className="flex items-center space-x-2">
                    <action.icon className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--accent-pink))]" />
                    <CardTitle className="font-display text-lg md:text-xl font-black uppercase tracking-wide group-hover:text-[hsl(var(--accent-pink))] transition-colors">
                      {action.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="font-cb-sans text-sm md:text-base mt-1">
                    {action.description}
                  </CardDescription>
                </Link>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col">
                {action.children && action.children.length > 0 ? (
                  <ul className="space-y-1 flex-1">
                    {action.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          to={child.href}
                          className="flex items-center justify-between gap-2 px-3 py-2 border border-border hover:border-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/5 transition-colors font-cb-sans text-sm group"
                        >
                          <span className="flex items-center gap-2">
                            <child.icon className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--accent-pink))]" />
                            <span>{child.name}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--accent-pink))]" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Button
                    asChild
                    className="w-full btn-primary font-display uppercase tracking-wide h-10 md:h-11 hover:bg-[hsl(var(--accent-pink))] hover:text-black transition-colors"
                  >
                    <Link to={action.href} className="flex items-center justify-center space-x-2">
                      <action.icon className="h-4 w-4" />
                      <span>OPEN</span>
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-industrial transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 font-display uppercase tracking-wide text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--accent-pink))]" />
              <span>ACCESS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="font-cb-sans text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between items-center">
                <span>Role:</span>
                <span className="capitalize font-medium text-foreground">{managementUser?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Level:</span>
                <span className="font-medium text-foreground text-right">
                  {managementUser?.role === 'admin'
                    ? 'Full'
                    : managementUser?.role === 'sales'
                    ? 'Sales & Ops'
                    : 'Read Only'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {managementUser?.role === 'admin' && (
          <Collapsible open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
            <Card className="border-industrial">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="p-4 md:p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 font-display uppercase tracking-wide text-base md:text-lg">
                      <span>🔧 Push Diagnostics</span>
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${diagnosticsOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <CardDescription className="font-cb-sans text-left">
                    Debug and test push notifications manually
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-4 md:p-6 pt-0">
                  <PushDiagnostics />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </ManagementLayout>
  );
};

export default ManagementDashboard;
