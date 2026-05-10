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
  Trees,
  Building2,
  Bed,
  Wine,
  UtensilsCrossed,
  PartyPopper,
  Waves,
  FileText,
  Image,
  Palette,
  Download,
  Settings,
  ChevronDown,
  Globe,
  Eye,
  Mail
} from 'lucide-react';

type Section = { name: string; path: string };
type Page = { name: string; path: string; icon: any; sections: Section[] };

const CMS_BASE = '/management/cms';
const VISUAL = `${CMS_BASE}/visual`;

const countryPages: Page[] = [
  { name: 'Country Home', path: `${VISUAL}/country`, icon: Trees, sections: [] },
  { name: 'Country Pub', path: `${VISUAL}/country/pub`, icon: UtensilsCrossed, sections: [
    { name: 'Pub Food', path: `${VISUAL}/country/pub/food` },
    { name: 'Pub Drink', path: `${VISUAL}/country/pub/drink` },
    { name: 'Hospitality', path: `${VISUAL}/country/pub/hospitality` },
  ]},
  { name: 'Country Rooms', path: `${VISUAL}/country/rooms`, icon: Bed, sections: [
    { name: 'Room Types', path: `${VISUAL}/country/rooms/types` },
    { name: 'Gallery', path: `${VISUAL}/country/rooms/gallery` },
  ]},
  { name: 'Country Parties', path: `${VISUAL}/country/parties`, icon: PartyPopper, sections: [] },
  { name: 'Country Events', path: `${VISUAL}/country/events`, icon: PartyPopper, sections: [
    { name: 'Weddings', path: `${VISUAL}/country/events/weddings` },
    { name: 'Birthdays', path: `${VISUAL}/country/events/birthdays` },
    { name: 'Business', path: `${VISUAL}/country/events/business` },
  ]},
];

const townPages: Page[] = [
  { name: 'Town Home', path: `${VISUAL}/town`, icon: Building2, sections: [] },
  { name: 'Town Food', path: `${VISUAL}/town/food`, icon: UtensilsCrossed, sections: [
    { name: 'The Black Bear', path: `${VISUAL}/town/food/black-bear` },
    { name: 'The B&B', path: `${VISUAL}/town/food/bnb` },
    { name: 'Hom Thai', path: `${VISUAL}/town/food/hom-thai` },
  ]},
  { name: 'Town Drink', path: `${VISUAL}/town/drink`, icon: Wine, sections: [
    { name: 'Cocktails', path: `${VISUAL}/town/drink/cocktails` },
  ]},
  { name: 'Town Rooms', path: `${VISUAL}/town/rooms`, icon: Bed, sections: [
    { name: 'Room Types', path: `${VISUAL}/town/rooms/types` },
    { name: 'Gallery', path: `${VISUAL}/town/rooms/gallery` },
  ]},
  { name: 'Town Pool', path: `${VISUAL}/town/pool`, icon: Waves, sections: [] },
];

const globalSections = [
  { name: 'Footer', path: `${VISUAL}/global/footer`, icon: FileText },
  { name: 'Navigation', path: `${VISUAL}/global/navigation`, icon: Globe },
  { name: 'Modal Content', path: `${CMS_BASE}/global/modals`, icon: Eye },
];

const emailTemplateStructure = [
  { name: 'Welcome Email', path: `${CMS_BASE}/email-templates/welcome`, icon: Mail },
  { name: 'Event Management', path: `${CMS_BASE}/email-templates/event`, icon: Mail },
];

const managementSections = [
  { name: 'Images', path: `${CMS_BASE}/images`, icon: Image },
  { name: 'Brand Assets', path: `${CMS_BASE}/brand`, icon: Palette },
  { name: 'Import/Export', path: `${CMS_BASE}/import`, icon: Download }
];

export const CMSSidebar = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    country: true,
    town: true,
    global: false,
    emails: false,
    management: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path: string) => currentPath === path;
  const isParentActive = (basePath: string) => currentPath.startsWith(basePath);

  const getNavClass = (isActiveItem: boolean) =>
    isActiveItem ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  const showText = state !== "collapsed" || isMobile;

  const renderPageGroup = (label: string, key: string, pages: Page[]) => (
    <SidebarGroup>
      <Collapsible open={expandedSections[key]} onOpenChange={() => toggleSection(key)}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
            <span className="flex items-center font-brutalist uppercase tracking-wide">
              <FileText className="mr-2 h-4 w-4" />
              {showText && label}
            </span>
            {showText && <ChevronDown className="h-4 w-4" />}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {pages.map((page) => (
                <SidebarMenuItem key={page.path}>
                  {page.sections.length > 0 ? (
                    <Collapsible defaultOpen={isParentActive(page.path)}>
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          className={`${getNavClass(isActive(page.path))} flex-1`}
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
                              <SidebarMenuSubButton asChild className={getNavClass(isActive(section.path))}>
                                <NavLink to={section.path}>{showText && section.name}</NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild className={getNavClass(isActive(page.path))}>
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
  );

  return (
    <Sidebar className="border-r bg-background" collapsible="icon">
      <SidebarContent className="pt-16 bg-background">
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={getNavClass(isActive(CMS_BASE))}>
                  <NavLink to={CMS_BASE}>
                    <Home className="mr-2 h-4 w-4" />
                    {showText && 'Overview'}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderPageGroup('Country', 'country', countryPages)}
        {renderPageGroup('Town', 'town', townPages)}

        {/* Global Content */}
        <SidebarGroup>
          <Collapsible open={expandedSections.global} onOpenChange={() => toggleSection('global')}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  {showText && 'Global Content'}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {globalSections.map((section) => (
                    <SidebarMenuItem key={section.path}>
                      <SidebarMenuButton asChild className={getNavClass(isActive(section.path))}>
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

        {/* Email Templates */}
        <SidebarGroup>
          <Collapsible open={expandedSections.emails} onOpenChange={() => toggleSection('emails')}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {showText && 'Email Templates'}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {emailTemplateStructure.map((template) => (
                    <SidebarMenuItem key={template.path}>
                      <SidebarMenuButton asChild className={getNavClass(isActive(template.path))}>
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

        {/* Assets */}
        <SidebarGroup>
          <Collapsible open={expandedSections.management} onOpenChange={() => toggleSection('management')}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <span className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {showText && 'Assets'}
                </span>
                {showText && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementSections.map((section) => (
                    <SidebarMenuItem key={section.path}>
                      <SidebarMenuButton asChild className={getNavClass(isActive(section.path))}>
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
