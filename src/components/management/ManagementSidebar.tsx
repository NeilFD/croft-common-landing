import { useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Home, 
  Building2,
  LogOut,
  ChevronDown,
  Settings,
  FileText,
  Mail,
  MessageSquare,
  Award,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  CalendarDays,
  Bot,
  BookOpen,
  Layout,
  Shield,
  FlaskConical,
  Bell,
  Send,
  History,
  UserCheck,
  Camera,
  Film,
  Database,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const managementModules = [
  {
    name: 'Overview',
    path: '/management',
    icon: Home,
    exactMatch: true
  },
  {
    name: 'AI Assistant',
    path: '/management/ai-assistant',
    icon: Bot,
    exactMatch: false,
    badge: 'NEW'
  }
];

const spacesSubModules = [
  {
    name: 'Venues',
    path: '/management/spaces/venues',
    icon: Building2,
    exactMatch: false
  },
  {
    name: 'Calendar',
    path: '/management/spaces/calendar',
    icon: Calendar,
    exactMatch: false
  },
  {
    name: 'Events',
    path: '/management/events',
    icon: CalendarDays,
    exactMatch: false
  },
  {
    name: 'Leads & Sales',
    path: '/management/spaces/leads',
    icon: Users,
    exactMatch: false
  }
];

export const ManagementSidebar = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { managementUser, signOut } = useManagementAuth();
  const { canAccessAdmin, canAccessCMS, canAccessResearch } = useRoleBasedAccess();
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modules: true,
    knowledge: true,
    spaces: true,
    admin: true,
    adminNotifications: false,
    adminAnalytics: false,
    adminManagement: false,
    cms: true,
    research: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string, exactMatch: boolean = false) => {
    if (exactMatch) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  // Keep sections expanded when on their routes
  const isOnSpacesRoute = currentPath.startsWith('/management/spaces');
  const isOnAdminRoute = currentPath.startsWith('/management/admin');
  const isOnCMSRoute = currentPath.startsWith('/management/cms');
  const isOnResearchRoute = currentPath.startsWith('/management/research');
  
  if (isOnSpacesRoute && !expandedSections.spaces) {
    setExpandedSections(prev => ({ ...prev, spaces: true }));
  }
  if (isOnAdminRoute && !expandedSections.admin) {
    setExpandedSections(prev => ({ ...prev, admin: true }));
    // Expand admin subsections based on current path
    if (currentPath.startsWith('/management/admin/notifications')) {
      setExpandedSections(prev => ({ ...prev, adminNotifications: true }));
    }
    if (currentPath.startsWith('/management/admin/analytics')) {
      setExpandedSections(prev => ({ ...prev, adminAnalytics: true }));
    }
    if (currentPath.startsWith('/management/admin/management')) {
      setExpandedSections(prev => ({ ...prev, adminManagement: true }));
    }
  }
  if (isOnCMSRoute && !expandedSections.cms) {
    setExpandedSections(prev => ({ ...prev, cms: true }));
  }
  if (isOnResearchRoute && !expandedSections.research) {
    setExpandedSections(prev => ({ ...prev, research: true }));
  }

  const getNavClass = (isActiveItem: boolean) =>
    isActiveItem ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  // Show text when not collapsed OR when on mobile
  const showText = state !== "collapsed" || isMobile;

  const handleNavigateToSite = async () => {
    await signOut();
    window.location.href = 'https://www.croftcommontest.com/';
  };

  return (
    <TooltipProvider>
      <Sidebar 
        className="border-r bg-background"
        collapsible="icon"
      >
        <SidebarHeader className="p-3 md:p-4">
          {showText && (
            <div className="font-industrial text-xs md:text-sm text-muted-foreground">
              <div className="font-brutalist font-black uppercase tracking-wide text-foreground text-sm md:text-base">MANAGEMENT</div>
              <div className="capitalize text-[hsl(var(--accent-pink))] text-xs md:text-sm">{managementUser?.role}</div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="bg-background">
          {/* Mini rail icons for collapsed state */}
          {state === "collapsed" && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management', true))}
                        >
                          <NavLink to="/management">
                            <Settings className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Management</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management/common-knowledge', false))}
                        >
                          <NavLink to="/management/common-knowledge">
                            <BookOpen className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Common Knowledge</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management/spaces', true))}
                        >
                          <NavLink to="/management/spaces">
                            <Building2 className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Spaces</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management/cms', false))}
                        >
                          <NavLink to="/management/cms">
                            <Layout className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">CMS</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management/admin', false))}
                        >
                          <NavLink to="/management/admin">
                            <Shield className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Admin</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={getNavClass(isActive('/management/research', false))}
                        >
                          <NavLink to="/management/research">
                            <FlaskConical className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Research</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {/* Management Modules Section */}
          {showText && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.modules} 
                onOpenChange={() => toggleSection('modules')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <Settings className="mr-2 h-4 w-4" />
                      MGMT
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.modules ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {managementModules.map((module) => (
                        <SidebarMenuItem key={module.path}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton 
                                asChild
                                className={getNavClass(isActive(module.path, module.exactMatch))}
                              >
                                <NavLink to={module.path} className="font-industrial flex items-center justify-between w-full">
                                  <span className="flex items-center">
                                    <module.icon className="mr-2 h-4 w-4" />
                                    {module.name}
                                  </span>
                                  {module.badge && (
                                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                      {module.badge}
                                    </span>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                           <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                              <p className="font-industrial">{module.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Common Knowledge Section */}
          {showText && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.knowledge} 
                onOpenChange={() => toggleSection('knowledge')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <BookOpen className="mr-2 h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      COMMON KNOWLEDGE
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.knowledge ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isActive('/management/common-knowledge', false))}
                            >
                              <NavLink to="/management/common-knowledge" className="font-industrial">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Dashboard
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                       <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Knowledge Dashboard</p>
                      </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Spaces Event Management Section */}
          {showText && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.spaces} 
                onOpenChange={() => toggleSection('spaces')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <Building2 className="mr-2 h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      SPACES
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.spaces ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {/* Spaces Dashboard */}
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isActive('/management/spaces', true))}
                            >
                              <NavLink to="/management/spaces" className="font-industrial">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Dashboard
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                       <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                         <p className="font-industrial">Spaces Dashboard</p>
                       </TooltipContent>
                         </Tooltip>
                       </SidebarMenuItem>
                       
                       {/* Sub-modules */}  
                       {spacesSubModules.map((module) => (
                         <SidebarMenuItem key={module.path}>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <SidebarMenuButton 
                                 asChild
                                 className={getNavClass(isActive(module.path, module.exactMatch))}
                               >
                                 <NavLink to={module.path} className="font-industrial">
                                   <module.icon className="mr-2 h-4 w-4" />
                                   {module.name}
                                 </NavLink>
                               </SidebarMenuButton>
                             </TooltipTrigger>
                             <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                              <p className="font-industrial">{module.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* CMS Section */}
          {showText && canAccessCMS() && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.cms} 
                onOpenChange={() => toggleSection('cms')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <Layout className="mr-2 h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      CMS
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.cms ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isActive('/management/cms', false))}
                            >
                              <NavLink to="/management/cms" className="font-industrial">
                                <Layout className="mr-2 h-4 w-4" />
                                Dashboard
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                            <p className="font-industrial">CMS Dashboard</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Admin Section */}
          {showText && canAccessAdmin() && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.admin} 
                onOpenChange={() => toggleSection('admin')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <Shield className="mr-2 h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      ADMIN
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.admin ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {/* Overview */}
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isActive('/management/admin', true))}
                            >
                              <NavLink to="/management/admin" end className="font-industrial">
                                <Home className="mr-2 h-4 w-4" />
                                Overview
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                            <p className="font-industrial">Admin Overview</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>

                      {/* Notifications Subsection */}
                      <SidebarMenuItem>
                        <Collapsible
                          open={expandedSections.adminNotifications}
                          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, adminNotifications: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-accent/50 rounded-md font-industrial">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              <span>Notifications</span>
                            </div>
                            <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections.adminNotifications ? 'rotate-90' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-4 mt-1">
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/notifications/compose', false))}
                                    >
                                      <NavLink to="/management/admin/notifications/compose" className="font-industrial">
                                        <Send className="mr-2 h-4 w-4" />
                                        Compose
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Compose Notification</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/notifications/history', false))}
                                    >
                                      <NavLink to="/management/admin/notifications/history" className="font-industrial">
                                        <History className="mr-2 h-4 w-4" />
                                        History
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Notification History</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>

                      {/* Analytics Subsection */}
                      <SidebarMenuItem>
                        <Collapsible
                          open={expandedSections.adminAnalytics}
                          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, adminAnalytics: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-accent/50 rounded-md font-industrial">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics</span>
                            </div>
                            <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections.adminAnalytics ? 'rotate-90' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-4 mt-1">
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/analytics/opt-in', false))}
                                    >
                                      <NavLink to="/management/admin/analytics/opt-in" className="font-industrial">
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Opt-in Analytics
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Opt-in Analytics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/analytics/users', false))}
                                    >
                                      <NavLink to="/management/admin/analytics/users" className="font-industrial">
                                        <Users className="mr-2 h-4 w-4" />
                                        User Analytics
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">User Analytics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/analytics/granular', false))}
                                    >
                                      <NavLink to="/management/admin/analytics/granular" className="font-industrial">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Granular Analytics
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Granular Analytics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/analytics/member-analytics', false))}
                                    >
                                      <NavLink to="/management/admin/analytics/member-analytics" className="font-industrial">
                                        <Users className="mr-2 h-4 w-4" />
                                        Member Analytics
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Member Analytics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/analytics/member-analytics-legacy', false))}
                                    >
                                      <NavLink to="/management/admin/analytics/member-analytics-legacy" className="font-industrial">
                                        <Users className="mr-2 h-4 w-4" />
                                        Legacy Member Analytics
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Legacy Member Analytics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>

                      {/* Management Subsection */}
                      <SidebarMenuItem>
                        <Collapsible
                          open={expandedSections.adminManagement}
                          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, adminManagement: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-accent/50 rounded-md font-industrial">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              <span>Management</span>
                            </div>
                            <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections.adminManagement ? 'rotate-90' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-4 mt-1">
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/management/subscribers', false))}
                                    >
                                      <NavLink to="/management/admin/management/subscribers" className="font-industrial">
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Subscribers
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Subscribers</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/management/moments', false))}
                                    >
                                      <NavLink to="/management/admin/management/moments" className="font-industrial">
                                        <Camera className="mr-2 h-4 w-4" />
                                        Moments Moderation
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Moments Moderation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/management/cinema', false))}
                                    >
                                      <NavLink to="/management/admin/management/cinema" className="font-industrial">
                                        <Film className="mr-2 h-4 w-4" />
                                        Cinema Management
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Cinema Management</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuButton 
                                      asChild
                                      className={getNavClass(isActive('/management/admin/member-analytics', false))}
                                    >
                                      <NavLink to="/management/admin/member-analytics" className="font-industrial">
                                        <Database className="mr-2 h-4 w-4" />
                                        Member Database
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                                    <p className="font-industrial">Member Database</p>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Research Section */}
          {showText && canAccessResearch() && (
            <SidebarGroup>
              <Collapsible 
                open={expandedSections.research} 
                onOpenChange={() => toggleSection('research')}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                    <span className="flex items-center font-brutalist uppercase tracking-wide">
                      <FlaskConical className="mr-2 h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      RESEARCH
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.research ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isActive('/management/research', false))}
                            >
                              <NavLink to="/management/research" className="font-industrial">
                                <FlaskConical className="mr-2 h-4 w-4" />
                                Field Research
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                            <p className="font-industrial">Field Research</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-3 md:p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToSite}
                className="w-full flex items-center justify-center space-x-2 font-brutalist uppercase tracking-wide h-8 md:h-9 text-xs md:text-sm"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                {showText && <span>SITE</span>}
              </Button>
            </TooltipTrigger>
            {!showText && (
              <TooltipContent side="right" className="bg-background text-foreground border border-border shadow-lg">
                <p className="font-industrial">Back to Main Site</p>
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
};