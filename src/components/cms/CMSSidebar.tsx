import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Home,
  Trees,
  Building2,
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

import {
  CMS_PAGES,
  topLevelOf,
  childrenOf,
  type CmsPageEntry,
} from '@/data/cmsPages';

const CMS_BASE = '/management/cms';
const VISUAL = `${CMS_BASE}/visual`;

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

const itemBase =
  'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm font-cb-sans transition-colors';
const itemActive = 'bg-foreground text-background';
const itemIdle = 'hover:bg-accent/60 text-foreground';

const standalonePages = topLevelOf('Standalone');
const countryPages = topLevelOf('Country');
const townPages = topLevelOf('Town');

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
  const pathFor = (slug: string) => `${VISUAL}/${slug}`;
  const isUnderSlug = (slug: string): boolean => {
    const base = pathFor(slug);
    return currentPath === base || currentPath.startsWith(`${base}/`);
  };

  /**
   * Recursively render an entry and any descendants found via childrenOf.
   * Depth controls indentation so a 3+ level tree stays legible.
   */
  const renderNode = (entry: CmsPageEntry, depth = 0): JSX.Element => {
    const children = childrenOf(entry.slug);
    const path = pathFor(entry.slug);
    const active = isActive(path);
    const Icon = entry.icon;
    const textSize = depth === 0 ? 'text-sm' : 'text-xs';

    if (children.length === 0) {
      return (
        <NavLink
          key={entry.slug}
          to={path}
          className={cn(itemBase, textSize, active ? itemActive : itemIdle)}
        >
          {depth === 0 && Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{entry.title}</span>
        </NavLink>
      );
    }

    return (
      <Collapsible key={entry.slug} defaultOpen={isUnderSlug(entry.slug)}>
        <div className="flex items-center">
          <NavLink
            to={path}
            className={cn(
              itemBase,
              textSize,
              'flex-1',
              active ? itemActive : itemIdle,
            )}
          >
            {depth === 0 && Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{entry.title}</span>
          </NavLink>
          <CollapsibleTrigger asChild>
            <button
              className="p-1 rounded hover:bg-accent/60"
              aria-label={`Toggle ${entry.title}`}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div
            className={cn(
              'mt-1 space-y-0.5 border-l border-border',
              depth === 0 ? 'ml-6 pl-2' : 'ml-4 pl-2',
            )}
          >
            {children.map((c) => renderNode(c, depth + 1))}
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
  }: {
    label: string;
    icon: any;
    keyName: string;
    children: React.ReactNode;
  }) => (
    <Collapsible open={open[keyName]} onOpenChange={() => toggle(keyName)}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-accent/60 font-display uppercase tracking-wide text-xs">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </span>
          <ChevronRight
            className={cn(
              'h-3 w-3 transition-transform',
              open[keyName] && 'rotate-90',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-0.5 pl-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <nav className="p-3 space-y-2">
      <NavLink
        to={CMS_BASE}
        end
        className={cn(itemBase, isActive(CMS_BASE) ? itemActive : itemIdle)}
      >
        <Home className="h-4 w-4" />
        <span>Overview</span>
      </NavLink>

      <Group label="Pages" icon={FileText} keyName="standalone">
        {standalonePages.map((p) => renderNode(p))}
      </Group>
      <Group label="Country" icon={Trees} keyName="country">
        {countryPages.map((p) => renderNode(p))}
      </Group>
      <Group label="Town" icon={Building2} keyName="town">
        {townPages.map((p) => renderNode(p))}
      </Group>
      <Group label="Global Content" icon={Globe} keyName="global">
        {globalSections.map((s) => (
          <NavLink
            key={s.path}
            to={s.path}
            className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}
          >
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
      <Group label="Email Templates" icon={Mail} keyName="emails">
        {emailTemplateStructure.map((s) => (
          <NavLink
            key={s.path}
            to={s.path}
            className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}
          >
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
      <Group label="Assets" icon={Settings} keyName="assets">
        {assetSections.map((s) => (
          <NavLink
            key={s.path}
            to={s.path}
            className={cn(itemBase, isActive(s.path) ? itemActive : itemIdle)}
          >
            <s.icon className="h-4 w-4" />
            <span>{s.name}</span>
          </NavLink>
        ))}
      </Group>
    </nav>
  );
};
