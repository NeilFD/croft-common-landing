import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Eye,
  Mail,
  Ticket,
  HelpCircle
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
    sections: [
      { name: 'FAQ', path: '/cms/faq/home' }
    ]
  },
  {
    name: 'Cafe',
    path: '/cms/visual/cafe',
    icon: Coffee,
    sections: [
      { name: 'Menu', path: '/cms/visual/cafe/menu' },
      { name: 'FAQ', path: '/cms/faq/cafe' }
    ]
  },
  {
    name: 'Cocktails',
    path: '/cms/visual/cocktails',
    icon: Wine,
    sections: [
      { name: 'Menu', path: '/cms/visual/cocktails/menu' },
      { name: 'FAQ', path: '/cms/faq/cocktails' }
    ]
  },
  {
    name: 'Beer',
    path: '/cms/visual/beer',
    icon: Beer,
    sections: [
      { name: 'Menu', path: '/cms/visual/beer/menu' },
      { name: 'FAQ', path: '/cms/faq/beer' }
    ]
  },
  {
    name: 'Kitchens',
    path: '/cms/visual/kitchens',
    icon: ChefHat,
    sections: [
      { name: 'Menu', path: '/cms/visual/kitchens/menu' },
      { name: 'FAQ', path: '/cms/faq/kitchens' }
    ]
  },
  {
    name: 'Hall',
    path: '/cms/visual/hall',
    icon: Calendar,
    sections: [
      { name: 'Menu', path: '/cms/visual/hall/menu' },
      { name: 'FAQ', path: '/cms/faq/hall' }
    ]
  },
  {
    name: 'Community',
    path: '/cms/visual/community',
    icon: Users,
    sections: [
      { name: 'Menu', path: '/cms/visual/community/menu' },
      { name: 'FAQ', path: '/cms/faq/community' }
    ]
  },
  {
    name: 'Common Room',
    path: '/cms/visual/common-room',
    icon: Building2,
    sections: [
      { name: 'Main', path: '/cms/visual/common-room/main' },
      { name: 'FAQ', path: '/cms/faq/common-room' }
    ]
  },
  {
    name: 'Calendar',
    path: '/cms/visual/calendar',
    icon: Calendar,
    sections: [
      { name: 'FAQ', path: '/cms/faq/calendar' }
    ]
  },
  {
    name: 'Common Good',
    path: '/cms/visual/common-good',
    icon: HelpCircle,
    sections: [
      { name: 'FAQ', path: '/cms/faq/common-good' }
    ]
  },
  {
    name: 'Book',
    path: '/cms/visual/book',
    icon: FileText,
    sections: [
      { name: 'FAQ', path: '/cms/faq/book' }
    ]
  },
  {
    name: 'Notifications',
    path: '/cms/visual/notifications',
    icon: MessageSquare,
    sections: [
      { name: 'FAQ', path: '/cms/faq/notifications' }
    ]
  },
  {
    name: 'Croft Common DateTime',
    path: '/cms/visual/croftcommondatetime',
    icon: Calendar,
    sections: [
      { name: 'FAQ', path: '/cms/faq/croftcommondatetime' }
    ]
  }
];

const globalSections = [
  { name: 'Footer Content', path: '/cms/visual/global/footer', icon: FileText },
  { name: 'Navigation', path: '/cms/visual/global/navigation', icon: Globe },
  { name: 'Subscription Form', path: '/cms/visual/global/subscription', icon: MessageSquare },
  { name: 'Modal Content', path: '/cms/global/modals', icon: Eye }
];

const emailTemplateStructure = [
  { name: 'Welcome Email', path: '/cms/email-templates/welcome', icon: Mail },
  { name: 'Cinema Tickets', path: '/cms/email-templates/cinema', icon: Ticket },
  { name: 'Event Management', path: '/cms/email-templates/event', icon: Calendar },
];

const managementSections = [
  { name: 'Images', path: '/cms/images', icon: Image },
  { name: 'Brand Assets', path: '/cms/brand', icon: Palette },
  { name: 'Import/Export', path: '/cms/import', icon: Download }
];

export const CMSSidebar = () => {
  const { state, open } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pages: true,
    global: false,
    emails: false,
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

  // Show text when not collapsed OR when on mobile (mobile should always show text when open)
  const showText = state !== "collapsed" || isMobile;

  return (
    <Sidebar 
      className="border-r"
      collapsible="icon"
    >
      <SidebarContent className="pt-16">
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
                  {showText && "Pages"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pageStructure.map((page) => (
                    <SidebarMenuItem key={page.path}>
                      {page.sections.length > 0 ? (
                        <Collapsible>
                          <div className="flex items-center">
                            <SidebarMenuButton 
                              asChild
                              className={`${getNavClass(isParentActive(page.path))} flex-1`}
                            >
                              <NavLink to={page.path}>
                                <page.icon className="mr-2 h-4 w-4" />
                                {showText && <span>{page.name}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                            {showText && (
                              <CollapsibleTrigger asChild>
                                <button className="p-1 hover:bg-accent rounded">
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {page.sections.map((section) => (
                                <SidebarMenuSubItem key={section.path}>
                                  <SidebarMenuSubButton 
                                    asChild
                                    className={getNavClass(isActive(section.path))}
                                  >
                                    <NavLink to={section.path}>
                                       {showText && section.name}
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
                            {showText && page.name}
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
                  {showText && "Global Content"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
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
                           {showText && section.name}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Email Templates Section */}
        <SidebarGroup>
          <Collapsible 
            open={expandedSections.emails} 
            onOpenChange={() => toggleSection('emails')}
          >
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {showText && "Email Templates"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {emailTemplateStructure.map((template) => (
                    <SidebarMenuItem key={template.path}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClass(isActive(template.path))}
                      >
                        <NavLink to={template.path}>
                          <template.icon className="mr-2 h-4 w-4" />
                          {showText && template.name}
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
                  {showText && "Management"}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
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
                          {showText && section.name}
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