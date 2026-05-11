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
  BookOpen,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { CMS_PAGES, topLevelOf, childrenOf, type CmsPageEntry } from '@/data/cmsPages';

type Section = { name: string; path: string };
type Page = { name: string; path: string; icon: any; sections: Section[] };

const CMS_BASE = '/management/cms';
const VISUAL = `${CMS_BASE}/visual`;

const toPage = (entry: CmsPageEntry): Page => ({
  name: entry.title,
  path: `${VISUAL}/${entry.slug}`,
  icon: entry.icon,
  sections: childrenOf(entry.slug).map((c) => ({
    name: c.title,
    path: `${VISUAL}/${c.slug}`,
  })),
});

const standalonePages: Page[] = topLevelOf('Standalone').map(toPage);
const countryPages: Page[] = topLevelOf('Country').map(toPage);
const townPages: Page[] = topLevelOf('Town').map(toPage);

const globalSections = [
  ...topLevelOf('Global').map((e) => ({
    name: e.title,
    path: `${VISUAL}/${e.slug}`,
    icon: e.icon,
  })),
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
    standalone: true,
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

      <Group label="Pages" icon={FileText} keyName="standalone">
        {standalonePages.map(renderPage)}
      </Group>
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
