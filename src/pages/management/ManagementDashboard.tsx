import { ManagementLayout } from '@/components/management/ManagementLayout';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BarChart3, BookOpen, Shield, Layout, FlaskConical, MessageSquare, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ManagementDashboard = () => {
  const { managementUser } = useManagementAuth();
  const { canAccessAdmin, canAccessCMS, canAccessResearch, canAccessFeedback } = useRoleBasedAccess();

  const allQuickActions = [
    {
      title: 'CHAT',
      description: 'Team communications',
      icon: MessageCircle,
      href: '/management/chat',
      color: 'text-[hsl(var(--accent-pink))]',
      show: true
    },
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
      title: 'FEEDBACK',
      description: 'Guest feedback',
      icon: MessageSquare,
      href: '/management/feedback',
      color: 'text-[hsl(var(--accent-pink))]',
      show: canAccessFeedback()
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

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              asChild
              variant="outline"
              className="h-auto flex-col gap-3 p-6 border-2 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-[hsl(var(--accent-pink))] hover:text-black hover:border-[hsl(var(--accent-pink))]"
            >
              <Link to={action.href} className="flex flex-col items-center justify-center">
                <action.icon className={`h-8 w-8 ${action.color}`} />
                <span className="font-brutalist text-xs uppercase tracking-wide text-center leading-tight mt-1">
                  {action.title}
                </span>
              </Link>
            </Button>
          ))}
        </div>

        <Card className="border-industrial transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-card/80 backdrop-blur-sm">
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