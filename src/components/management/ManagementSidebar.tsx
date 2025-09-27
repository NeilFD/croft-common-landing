import { useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useManagementAuth } from '@/hooks/useManagementAuth';
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
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const managementModules = [
  {
    name: 'Overview',
    path: '/management',
    icon: Home,
    exactMatch: true
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
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modules: true,
    spaces: true,
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

  // Keep Spaces section expanded when on any spaces sub-route
  const isOnSpacesRoute = currentPath.startsWith('/management/spaces');
  if (isOnSpacesRoute && !expandedSections.spaces) {
    setExpandedSections(prev => ({ ...prev, spaces: true }));
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
        <SidebarHeader className="p-4">
          {showText && (
            <div className="font-industrial text-sm text-muted-foreground">
              <div className="font-brutalist font-black uppercase tracking-wide text-foreground">MANAGEMENT</div>
              <div className="capitalize text-[hsl(var(--accent-pink))]">{managementUser?.role}</div>
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
                      <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Management</p>
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
                      <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
                        <p className="font-industrial">Spaces</p>
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
                                <NavLink to={module.path} className="font-industrial">
                                  <module.icon className="mr-2 h-4 w-4" />
                                  {module.name}
                                </NavLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
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
                          <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
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
                            <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
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
        </SidebarContent>

        <SidebarFooter className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToSite}
                className="w-full flex items-center justify-center space-x-2 font-brutalist uppercase tracking-wide"
              >
                <LogOut className="h-4 w-4" />
                {showText && <span>SITE</span>}
              </Button>
            </TooltipTrigger>
            {!showText && (
              <TooltipContent side="right" className="bg-card text-foreground border border-border shadow-lg">
                <p className="font-industrial">Back to Main Site</p>
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
};