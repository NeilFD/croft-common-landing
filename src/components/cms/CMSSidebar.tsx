import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Home, 
  Coffee, 
  Wine, 
  Beer, 
  ChefHat, 
  Calendar, 
  Users, 
  Building2,
  FileText,
  Image,
  Palette,
  Download,
  Settings,
  ChevronDown,
  Globe,
  MessageSquare,
  Eye
} from 'lucide-react';

const pageStructure = [
  {
    name: 'Overview',
    path: '/cms',
    icon: Home,
    sections: []
  },
  {
    name: 'Home (Index)',
    path: '/cms/visual/home',
    icon: Home,
    sections: []
  },
  {
    name: 'Cafe',
    path: '/cms/visual/cafe',
    icon: Coffee,
    sections: [
      { name: 'Menu', path: '/cms/visual/cafe/menu' }
    ]
  },
  {
    name: 'Cocktails',
    path: '/cms/visual/cocktails',
    icon: Wine,
    sections: [
      { name: 'Menu', path: '/cms/visual/cocktails/menu' }
    ]
  },
  {
    name: 'Beer',
    path: '/cms/visual/beer',
    icon: Beer,
    sections: [
      { name: 'Menu', path: '/cms/visual/beer/menu' }
    ]
  },
  {
    name: 'Kitchens',
    path: '/cms/visual/kitchens',
    icon: ChefHat,
    sections: [
      { name: 'Menu', path: '/cms/visual/kitchens/menu' }
    ]
  },
  {
    name: 'Hall',
    path: '/cms/visual/hall',
    icon: Calendar,
    sections: [
      { name: 'Menu', path: '/cms/visual/hall/menu' }
    ]
  },
  {
    name: 'Community',
    path: '/cms/visual/community',
    icon: Users,
    sections: [
      { name: 'Menu', path: '/cms/visual/community/menu' }
    ]
  },
  {
    name: 'Common Room',
    path: '/cms/visual/common-room',
    icon: Building2,
    sections: []
  }
];

const globalSections = [
  { name: 'Footer Content', path: '/cms/global/footer', icon: FileText },
  { name: 'Navigation', path: '/cms/global/navigation', icon: Globe },
  { name: 'Subscription Form', path: '/cms/global/subscription', icon: MessageSquare },
  { name: 'Modal Content', path: '/cms/global/modals', icon: Eye }
];

const managementSections = [
  { name: 'Images', path: '/cms/images', icon: Image },
  { name: 'Brand Assets', path: '/cms/brand', icon: Palette },
  { name: 'Import/Export', path: '/cms/import', icon: Download }
];

export const CMSSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pages: true,
    global: false,
    management: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => currentPath === path;
  const isParentActive = (basePath: string) => currentPath.startsWith(basePath);

  const getNavClass = (isActiveItem: boolean) =>
    isActiveItem ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar 
      className="border-r"
      collapsible="icon"
    >
      <SidebarContent>
        {/* Pages Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.pages} 
            onOpenChange={() => toggleSection('pages')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && "Pages"}
                </span>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pageStructure.map((page) => (
                    <SidebarMenuItem key={page.path}>
                      {page.sections.length > 0 ? (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton 
                              asChild
                              className={getNavClass(isParentActive(page.path))}
                            >
                              <NavLink to={page.path}>
                                <page.icon className="mr-2 h-4 w-4" />
                                {state !== "collapsed" && (
                                  <>
                                    <span>{page.name}</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {page.sections.map((section) => (
                                <SidebarMenuSubItem key={section.path}>
                                  <SidebarMenuSubButton 
                                    asChild
                                    className={getNavClass(isActive(section.path))}
                                  >
                                    <NavLink to={section.path}>
                                      {state !== "collapsed" && section.name}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton 
                          asChild
                          className={getNavClass(isActive(page.path))}
                        >
                          <NavLink to={page.path}>
                            <page.icon className="mr-2 h-4 w-4" />
                            {state !== "collapsed" && page.name}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Global Content Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.global} 
            onOpenChange={() => toggleSection('global')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && "Global Content"}
                </span>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {globalSections.map((section) => (
                    <SidebarMenuItem key={section.path}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClass(isActive(section.path))}
                      >
                        <NavLink to={section.path}>
                          <section.icon className="mr-2 h-4 w-4" />
                          {state !== "collapsed" && section.name}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.management} 
            onOpenChange={() => toggleSection('management')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && "Management"}
                </span>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementSections.map((section) => (
                    <SidebarMenuItem key={section.path}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClass(isActive(section.path))}
                      >
                        <NavLink to={section.path}>
                          <section.icon className="mr-2 h-4 w-4" />
                          {state !== "collapsed" && section.name}
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
    </Sidebar>
  );
};