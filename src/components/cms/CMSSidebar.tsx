import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
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
  ChevronRight,
  Globe,
  Eye,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const assetSections = [
  { name: 'Images', path: `${CMS_BASE}/images`, icon: Image },
  { name: 'Brand Assets', path: `${CMS_BASE}/brand`, icon: Palette },
  { name: 'Import/Export', path: `${CMS_BASE}/import`, icon: Download },
];

const itemBase = 'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm font-cb-sans transition-colors';
const itemActive = 'bg-foreground text-background';
const itemIdle = 'hover:bg-accent/60 text-foreground';

export const CMSSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [open, setOpen] = useState<Record<string, boolean>>({
    country: true,
    town: true,
    global: false,
    emails: false,
    assets: false,
  });
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const isActive = (path: string) => currentPath === path;
  const isParentActive = (basePath: string) => currentPath.startsWith(basePath);

  const renderPage = (page: Page) => {
    if (page.sections.length === 0) {
      return (
        <NavLink key={page.path} to={page.path} className={cn(itemBase, isActive(page.path) ? itemActive : itemIdle)}>
          <page.icon className="h-4 w-4" />
          <span>{page.name}</span>
        </NavLink>
      );
    }
    return (
      <Collapsible key={page.path} defaultOpen={isParentActive(page.path)}>
        <div className="flex items-center">
          <NavLink
            to={page.path}
            className={cn(itemBase, 'flex-1', isActive(page.path) ? itemActive : itemIdle)}
          >
            <page.icon className="h-4 w-4" />
            <span>{page.name}</span>
          </NavLink>
          <CollapsibleTrigger asChild>
            <button className="p-1 rounded hover:bg-accent/60" aria-label={`Toggle ${page.name}`}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-2">
            {page.sections.map((s) => (
              <NavLink key={s.path} to={s.path} className={cn(itemBase, 'text-xs', isActive(s.path) ? itemActive : itemIdle)}>
                <span>{s.name}</span>
              </NavLink>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const Group = ({
    label,
    icon: Icon,
    keyName,
    children,
  }: { label: string; icon: any; keyName: string; children: React.ReactNode }) => (
    <Collapsible open={open[keyName]} onOpenChange={() => toggle(keyName)}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-accent/60 font-display uppercase tracking-wide text-xs">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </span>
          <ChevronRight className={cn('h-3 w-3 transition-transform', open[keyName] && 'rotate-90')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-0.5 pl-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <nav className="p-3 space-y-2">
      <NavLink to={CMS_BASE} end className={cn(itemBase, isActive(CMS_BASE) ? itemActive : itemIdle)}>
        <Home className="h-4 w-4" />
        <span>Overview</span>
      </NavLink>

      <Group label="Country" icon={Trees} keyName="country">
        {countryPages.map(renderPage)}
      </Group>
      <Group label="Town" icon={Building2} keyName="town">
        {townPages.map(renderPage)}
      </Group>
      <Group label="Global Content" icon={Globe} keyName="global">
        {globalSections.map((s) => (
          <NavLink key={s.path} to={s.path} className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}>
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
      <Group label="Email Templates" icon={Mail} keyName="emails">
        {emailTemplateStructure.map((s) => (
          <NavLink key={s.path} to={s.path} className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}>
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
      <Group label="Assets" icon={Settings} keyName="assets">
        {assetSections.map((s) => (
          <NavLink key={s.path} to={s.path} className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}>
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
    </nav>
  );
};
