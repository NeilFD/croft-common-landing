import { ManagementLayout } from '@/components/management/ManagementLayout';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BarChart3, BookOpen, Shield, Layout, FlaskConical, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ManagementDashboard = () => {
  const { managementUser } = useManagementAuth();
  const { canAccessAdmin, canAccessCMS, canAccessResearch, canAccessFeedback } = useRoleBasedAccess();

  const allQuickActions = [
    {
      title: 'COMMON KNOWLEDGE',
      description: 'Operational docs & SOPs',
      icon: BookOpen,
      href: '/management/common-knowledge',
      color: 'text-[hsl(var(--accent-pink))]',
      show: true
    },
    {
      title: 'SPACES',
      description: 'Event management system',
      icon: Building2,
      href: '/management/spaces',
      color: 'text-[hsl(var(--accent-pink))]',
      show: true
    },
    {
      title: 'ADMIN',
      description: 'System administration',
      icon: Shield,
      href: '/management/admin',
      color: 'text-[hsl(var(--accent-pink))]',
      show: canAccessAdmin()
    },
    {
      title: 'CMS',
      description: 'Content management',
      icon: Layout,
      href: '/management/cms',
      color: 'text-[hsl(var(--accent-pink))]',
      show: canAccessCMS()
    },
    {
      title: 'RESEARCH',
      description: 'Research & development',
      icon: FlaskConical,
      href: '/management/research',
      color: 'text-[hsl(var(--accent-pink))]',
      show: canAccessResearch()
    },
    {
      title: 'FEEDBACK',
      description: 'Customer feedback & sentiment',
      icon: MessageSquare,
      href: '/management/feedback',
      color: 'text-[hsl(var(--accent-pink))]',
      show: canAccessFeedback()
    }
  ];

  const quickActions = allQuickActions.filter(action => action.show);

  return (
    <ManagementLayout>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
        <div>
          <h1 className="text-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">MANAGEMENT</h1>
          <p className="font-industrial text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {managementUser?.user.email}
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="border-industrial hover:shadow-brutal transition-all">
              <CardHeader className="pb-3 p-4 md:p-6">
                <div className="flex items-center space-x-2">
                  <action.icon className={`h-5 w-5 md:h-6 md:w-6 ${action.color}`} />
                  <CardTitle className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wide">{action.title}</CardTitle>
                </div>
                <CardDescription className="font-industrial text-sm md:text-base">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <Button asChild className="w-full btn-primary font-brutalist uppercase tracking-wide h-10 md:h-11">
                  <Link to={action.href} className="flex items-center justify-center space-x-2">
                    <action.icon className="h-4 w-4" />
                    <span>OPEN</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-industrial">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 font-brutalist uppercase tracking-wide text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--accent-pink))]" />
              <span>ACCESS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="font-industrial text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between items-center">
                <span>Role:</span>
                <span className="capitalize font-medium text-foreground">{managementUser?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Level:</span>
                <span className="font-medium text-foreground text-right">
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