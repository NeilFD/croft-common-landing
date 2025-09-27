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
import { 
  Home, 
  Building2,
  LogOut,
  ChevronDown,
  Settings,
  BarChart3,
  Users
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
    <Sidebar 
      className="border-r bg-background"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        {showText && (
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Management Portal</div>
            <div className="capitalize">{managementUser?.role}</div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-background">
        {/* Management Modules Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.modules} 
            onOpenChange={() => toggleSection('modules')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {showText && "Management"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementModules.map((module) => (
                    <SidebarMenuItem key={module.path}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClass(isActive(module.path, module.exactMatch))}
                      >
                        <NavLink to={module.path}>
                          <module.icon className="mr-2 h-4 w-4" />
                          {showText && module.name}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Spaces Event Management Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.spaces} 
            onOpenChange={() => toggleSection('spaces')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  {showText && "Spaces"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Spaces Dashboard */}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      className={getNavClass(isActive('/management/spaces', true))}
                    >
                      <NavLink to="/management/spaces">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {showText && "Dashboard"}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Sub-modules */}  
                  {spacesSubModules.map((module) => (
                    <SidebarMenuItem key={module.path}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClass(isActive(module.path, module.exactMatch))}
                      >
                        <NavLink to={module.path}>
                          <module.icon className="mr-2 h-4 w-4" />
                          {showText && module.name}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateToSite}
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          {showText && <span>Back to Site</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};