import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Bell, 
  BarChart3, 
  Users, 
  Settings, 
  Home,
  Send,
  History,
  TrendingUp,
  UserCheck,
  Camera,
  Database,
  Film
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import CroftLogo from '@/components/CroftLogo';

const navigationItems = [
  {
    title: 'Overview',
    url: '/admin',
    icon: Home,
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { title: 'Compose', url: '/admin/notifications/compose', icon: Send },
      { title: 'History', url: '/admin/notifications/history', icon: History },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    items: [
      { title: 'Opt-in Analytics', url: '/admin/analytics/opt-in', icon: TrendingUp },
      { title: 'User Analytics', url: '/admin/analytics/users', icon: Users },
      { title: 'Granular Analytics', url: '/admin/analytics/granular', icon: BarChart3 },
    ],
  },
  {
    title: 'Management',
    icon: Settings,
    items: [
      { title: 'Subscribers', url: '/admin/management/subscribers', icon: UserCheck },
      { title: 'Moments Moderation', url: '/admin/management/moments', icon: Camera },
      { title: 'Cinema Management', url: '/admin/management/cinema', icon: Film },
      { title: 'Member Database', url: '/admin/member-analytics', icon: Database },
    ],
  },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const isParentActive = (items: { url: string }[]) => 
    items.some(item => currentPath.startsWith(item.url));

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <CroftLogo size="sm" className="shrink-0" />
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-lg">Admin</h2>
              <p className="text-sm text-muted-foreground">Croft Common</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            {section.items ? (
              <>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {!collapsed && section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to={section.url} className={getNavClass}>
                        <section.icon className="h-4 w-4" />
                        {!collapsed && <span>{section.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <div className="p-2 border-t">
        <SidebarTrigger className="w-full" />
      </div>
    </Sidebar>
  );
};