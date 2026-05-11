import { lazy, ComponentType, LazyExoticComponent } from 'react';
import {
  BookOpen, Trees, Building2, Bed, Wine, UtensilsCrossed, PartyPopper, Waves,
  ChefHat, Music, Home, Users, Sparkles, ScrollText, Calendar, Beer as BeerIcon,
  Coffee, Martini, Castle, Mail, Lock, FileText, Heart, Globe, Image as ImageIcon,
  Palette, Download, Eye,
} from 'lucide-react';

/**
 * SINGLE SOURCE OF TRUTH for every public page in the site.
 *
 * Adding a new public page:
 *   1. Add a <Route> in src/App.tsx
 *   2. Add an entry below
 *
 * The CMS sidebar, CMS overview, CMS visual editor and SEO Monitor
 * all read from this registry. The build-time check
 * (scripts/check-cms-registry.ts) fails the build if any public
 * route in App.tsx is missing here.
 */

export type CmsPageGroup = 'Standalone' | 'Country' | 'Town' | 'Members' | 'Global';

export interface CmsPageEntry {
  /** Stable identifier used as `page` slug for cms_content rows. */
  slug: string;
  /** Public site route (the path users hit). */
  route: string;
  /** Sidebar / overview name. */
  title: string;
  /** Short helper text shown on overview cards. */
  description: string;
  /** Group bucket for sidebar. */
  group: CmsPageGroup;
  /** Lucide icon for sidebar/overview. */
  icon: ComponentType<{ className?: string }>;
  /** Lazy-loaded component for the CMS visual editor preview. */
  component: LazyExoticComponent<ComponentType<any>>;
  /** Optional parent slug for nested sidebar entries. */
  parentSlug?: string;
  /** SEO sync settings. */
  seo: {
    /** When false the route is intentionally excluded from seo_pages. */
    include: boolean;
    defaultTitle: string;
    defaultDescription: string;
    noindex?: boolean;
  };
  /** Property context for PropertyProvider in the visual editor. */
  property?: 'country' | 'town';
}

// Lazy imports keep the CMS bundle small.
const Landing = lazy(() => import('@/pages/Landing'));
const About = lazy(() => import('@/pages/crazybear/About'));
const Members = lazy(() => import('@/pages/crazybear/Members'));
const BearsDen = lazy(() => import('@/pages/crazybear/BearsDen'));
const Curious = lazy(() => import('@/pages/crazybear/Curious'));
const HouseRules = lazy(() => import('@/pages/HouseRules'));
const Community = lazy(() => import('@/pages/Community'));
const Cafe = lazy(() => import('@/pages/Cafe'));
const Cocktails = lazy(() => import('@/pages/Cocktails'));
const Beer = lazy(() => import('@/pages/Beer'));
const Kitchens = lazy(() => import('@/pages/Kitchens'));
const OneKitchenMenu = lazy(() => import('@/pages/OneKitchenMenu'));
const Hall = lazy(() => import('@/pages/Hall'));
const EventEnquiry = lazy(() => import('@/pages/EventEnquiry'));
const Book = lazy(() => import('@/pages/Book'));
const Privacy = lazy(() => import('@/pages/Privacy'));

const CountryHome = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryHome })));
const CountryPub = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryPub })));
const CountryPubFood = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryPubFood })));
const CountryPubDrink = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryPubDrink })));
const CountryPubHospitality = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryPubHospitality })));
const CountryRooms = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryRooms })));
const CountryRoomTypes = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryRoomTypes })));
const CountryRoomGallery = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryRoomGallery })));
const CountryParties = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryParties })));
const CountryEvents = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryEvents })));
const CountryWeddings = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryWeddings })));
const CountryBirthdays = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryBirthdays })));
const CountryBusiness = lazy(() => import('@/pages/property').then(m => ({ default: m.CountryBusiness })));
const CountryCulture = lazy(() => import('@/pages/property/CountryCulture'));

const TownHome = lazy(() => import('@/pages/property').then(m => ({ default: m.TownHome })));
const TownFood = lazy(() => import('@/pages/property').then(m => ({ default: m.TownFood })));
const TownBlackBear = lazy(() => import('@/pages/property').then(m => ({ default: m.TownBlackBear })));
const TownBnB = lazy(() => import('@/pages/property').then(m => ({ default: m.TownBnB })));
const TownHomThai = lazy(() => import('@/pages/property').then(m => ({ default: m.TownHomThai })));
const TownDrink = lazy(() => import('@/pages/property').then(m => ({ default: m.TownDrink })));
const TownCocktails = lazy(() => import('@/pages/property').then(m => ({ default: m.TownCocktails })));
const TownRooms = lazy(() => import('@/pages/property').then(m => ({ default: m.TownRooms })));
const TownRoomTypes = lazy(() => import('@/pages/property').then(m => ({ default: m.TownRoomTypes })));
const TownRoomGallery = lazy(() => import('@/pages/property').then(m => ({ default: m.TownRoomGallery })));
const TownPool = lazy(() => import('@/pages/property').then(m => ({ default: m.TownPool })));
const TownCulture = lazy(() => import('@/pages/property/TownCulture'));

const CMSFooterPreview = lazy(() => import('@/pages/CMSFooterPreview'));
const CMSNavigationPreview = lazy(() => import('@/pages/CMSNavigationPreview'));
const CMSEmailTemplates = lazy(() => import('@/pages/CMSEmailTemplates'));

export const CMS_PAGES: CmsPageEntry[] = [
  // ─── Standalone marketing pages ───────────────────────────────
  {
    slug: 'landing',
    route: '/',
    title: 'Landing',
    description: 'Top-of-funnel hub for Town & Country',
    group: 'Standalone',
    icon: Home,
    component: Landing,
    seo: {
      include: true,
      defaultTitle: 'Crazy Bear | Town & Country',
      defaultDescription: 'Two pubs. One spirit. Discover Crazy Bear Town and Country.',
    },
  },
  {
    slug: 'about',
    route: '/about',
    title: 'About',
    description: 'Origin story, timeline, press',
    group: 'Standalone',
    icon: BookOpen,
    component: About,
    seo: {
      include: true,
      defaultTitle: 'About | Crazy Bear',
      defaultDescription: 'The story of Crazy Bear: Town & Country.',
    },
  },
  {
    slug: 'house-rules',
    route: '/house-rules',
    title: 'House Rules',
    description: 'How we run the show',
    group: 'Standalone',
    icon: ScrollText,
    component: HouseRules,
    seo: {
      include: true,
      defaultTitle: 'House Rules | Crazy Bear',
      defaultDescription: 'How we run the show. The rules of the house.',
    },
  },
  {
    slug: 'members',
    route: '/members',
    title: 'Members',
    description: 'Members landing & sign-in gate',
    group: 'Standalone',
    icon: Users,
    component: Members,
    seo: {
      include: true,
      defaultTitle: 'Members | Crazy Bear',
      defaultDescription: 'Sign in or join the Bears Den.',
    },
  },
  {
    slug: 'bears-den',
    route: '/bears-den',
    title: 'Bears Den',
    description: 'The members club',
    group: 'Standalone',
    icon: Sparkles,
    component: BearsDen,
    seo: {
      include: true,
      defaultTitle: 'Bears Den | Crazy Bear',
      defaultDescription: 'The members club. Inside Crazy Bear.',
    },
  },
  {
    slug: 'curious',
    route: '/curious',
    title: 'Curious',
    description: 'Curious Bear: events, cinema, secret stuff',
    group: 'Standalone',
    icon: Sparkles,
    component: Curious,
    seo: {
      include: true,
      defaultTitle: 'Curious | Crazy Bear',
      defaultDescription: 'Curious Bear. Hidden things. Secret stuff.',
    },
  },
  {
    slug: 'community',
    route: '/community',
    title: 'Community',
    description: 'Community feed and updates',
    group: 'Standalone',
    icon: Heart,
    component: Community,
    seo: {
      include: true,
      defaultTitle: 'Community | Crazy Bear',
      defaultDescription: 'Community moments and updates from Crazy Bear.',
    },
  },
  {
    slug: 'cafe',
    route: '/cafe',
    title: 'Cafe',
    description: 'All-day cafe',
    group: 'Standalone',
    icon: Coffee,
    component: Cafe,
    seo: {
      include: true,
      defaultTitle: 'Cafe | Crazy Bear',
      defaultDescription: 'All-day cafe at Crazy Bear.',
    },
  },
  {
    slug: 'cocktails',
    route: '/cocktails',
    title: 'Cocktails',
    description: 'Cocktail bar',
    group: 'Standalone',
    icon: Martini,
    component: Cocktails,
    seo: {
      include: true,
      defaultTitle: 'Cocktails | Crazy Bear',
      defaultDescription: 'The cocktail bar at Crazy Bear.',
    },
  },
  {
    slug: 'beer',
    route: '/beer',
    title: 'Beer',
    description: 'Beer hall and tap list',
    group: 'Standalone',
    icon: BeerIcon,
    component: Beer,
    seo: {
      include: true,
      defaultTitle: 'Beer | Crazy Bear',
      defaultDescription: 'Beer hall, tap list and more.',
    },
  },
  {
    slug: 'kitchens',
    route: '/kitchens',
    title: 'Kitchens',
    description: 'The kitchens overview',
    group: 'Standalone',
    icon: ChefHat,
    component: Kitchens,
    seo: {
      include: true,
      defaultTitle: 'Kitchens | Crazy Bear',
      defaultDescription: 'The kitchens at Crazy Bear.',
    },
  },
  {
    slug: 'onekitchen-menu',
    route: '/onekitchen-menu',
    title: 'One Kitchen Menu',
    description: 'Single combined kitchen menu',
    group: 'Standalone',
    icon: UtensilsCrossed,
    component: OneKitchenMenu,
    seo: {
      include: true,
      defaultTitle: 'Kitchen Menu | Crazy Bear',
      defaultDescription: 'The full kitchen menu, all in one place.',
    },
  },
  {
    slug: 'hall',
    route: '/hall',
    title: 'Hall',
    description: 'The Hall venue',
    group: 'Standalone',
    icon: Castle,
    component: Hall,
    seo: {
      include: true,
      defaultTitle: 'The Hall | Crazy Bear',
      defaultDescription: 'The Hall at Crazy Bear. Events and hire.',
    },
  },
  {
    slug: 'event-enquiry',
    route: '/event-enquiry',
    title: 'Event Enquiry',
    description: 'Event enquiry form',
    group: 'Standalone',
    icon: Mail,
    component: EventEnquiry,
    seo: {
      include: true,
      defaultTitle: 'Event Enquiry | Crazy Bear',
      defaultDescription: 'Tell us about your event.',
    },
  },
  {
    slug: 'book',
    route: '/book',
    title: 'Book',
    description: 'Booking landing page',
    group: 'Standalone',
    icon: Calendar,
    component: Book,
    seo: {
      include: true,
      defaultTitle: 'Book | Crazy Bear',
      defaultDescription: 'Book a table or a stay at Crazy Bear.',
    },
  },
  {
    slug: 'privacy',
    route: '/privacy',
    title: 'Privacy',
    description: 'Privacy policy',
    group: 'Standalone',
    icon: Lock,
    component: Privacy,
    seo: {
      include: true,
      defaultTitle: 'Privacy | Crazy Bear',
      defaultDescription: 'Crazy Bear privacy policy.',
    },
  },

  // ─── Country ──────────────────────────────────────────────────
  { slug: 'country', route: '/country', title: 'Country Home', description: 'Stadhampton landing', group: 'Country', icon: Trees, component: CountryHome, property: 'country',
    seo: { include: true, defaultTitle: 'Crazy Bear Country | Stadhampton', defaultDescription: 'Crazy Bear Country at Stadhampton.' } },
  { slug: 'country/pub', route: '/country/pub', title: 'Country Pub', description: 'Pub, food, drink, hospitality', group: 'Country', icon: UtensilsCrossed, component: CountryPub, parentSlug: 'country', property: 'country',
    seo: { include: true, defaultTitle: 'The Pub | Crazy Bear Country', defaultDescription: 'The Pub at Crazy Bear Country.' } },
  { slug: 'country/pub/food', route: '/country/pub/food', title: 'Pub Food', description: 'Food at the Country pub', group: 'Country', icon: UtensilsCrossed, component: CountryPubFood, parentSlug: 'country/pub', property: 'country',
    seo: { include: true, defaultTitle: 'Food | The Pub, Crazy Bear Country', defaultDescription: 'Food at the Country pub.' } },
  { slug: 'country/pub/drink', route: '/country/pub/drink', title: 'Pub Drink', description: 'Drinks at the Country pub', group: 'Country', icon: Wine, component: CountryPubDrink, parentSlug: 'country/pub', property: 'country',
    seo: { include: true, defaultTitle: 'Drink | The Pub, Crazy Bear Country', defaultDescription: 'Drinks at the Country pub.' } },
  { slug: 'country/pub/hospitality', route: '/country/pub/hospitality', title: 'Hospitality', description: 'Country pub hospitality', group: 'Country', icon: BookOpen, component: CountryPubHospitality, parentSlug: 'country/pub', property: 'country',
    seo: { include: true, defaultTitle: 'Hospitality | Crazy Bear Country', defaultDescription: 'Hospitality at the Country pub.' } },
  { slug: 'country/rooms', route: '/country/rooms', title: 'Country Rooms', description: 'Bedrooms and gallery', group: 'Country', icon: Bed, component: CountryRooms, parentSlug: 'country', property: 'country',
    seo: { include: true, defaultTitle: 'Rooms | Crazy Bear Country', defaultDescription: 'Rooms at Crazy Bear Country.' } },
  { slug: 'country/rooms/types', route: '/country/rooms/types', title: 'Room Types', description: 'Country room types', group: 'Country', icon: Bed, component: CountryRoomTypes, parentSlug: 'country/rooms', property: 'country',
    seo: { include: true, defaultTitle: 'Room Types | Crazy Bear Country', defaultDescription: 'Room types at Crazy Bear Country.' } },
  { slug: 'country/rooms/gallery', route: '/country/rooms/gallery', title: 'Room Gallery', description: 'Country room gallery', group: 'Country', icon: ImageIcon, component: CountryRoomGallery, parentSlug: 'country/rooms', property: 'country',
    seo: { include: true, defaultTitle: 'Gallery | Crazy Bear Country', defaultDescription: 'Room gallery at Crazy Bear Country.' } },
  { slug: 'country/parties', route: '/country/parties', title: 'Country Parties', description: 'Parties at the Country', group: 'Country', icon: PartyPopper, component: CountryParties, parentSlug: 'country', property: 'country',
    seo: { include: true, defaultTitle: 'Parties | Crazy Bear Country', defaultDescription: 'Parties at Crazy Bear Country.' } },
  { slug: 'country/events', route: '/country/events', title: 'Country Events', description: 'Weddings, birthdays, business', group: 'Country', icon: PartyPopper, component: CountryEvents, parentSlug: 'country', property: 'country',
    seo: { include: true, defaultTitle: 'Events | Crazy Bear Country', defaultDescription: 'Events at Crazy Bear Country.' } },
  { slug: 'country/events/weddings', route: '/country/events/weddings', title: 'Weddings', description: 'Country weddings', group: 'Country', icon: PartyPopper, component: CountryWeddings, parentSlug: 'country/events', property: 'country',
    seo: { include: true, defaultTitle: 'Weddings | Crazy Bear Country', defaultDescription: 'Weddings at Crazy Bear Country.' } },
  { slug: 'country/events/birthdays', route: '/country/events/birthdays', title: 'Birthdays', description: 'Country birthdays', group: 'Country', icon: PartyPopper, component: CountryBirthdays, parentSlug: 'country/events', property: 'country',
    seo: { include: true, defaultTitle: 'Birthdays | Crazy Bear Country', defaultDescription: 'Birthdays at Crazy Bear Country.' } },
  { slug: 'country/events/business', route: '/country/events/business', title: 'Business', description: 'Country business', group: 'Country', icon: PartyPopper, component: CountryBusiness, parentSlug: 'country/events', property: 'country',
    seo: { include: true, defaultTitle: 'Business | Crazy Bear Country', defaultDescription: 'Business at Crazy Bear Country.' } },
  { slug: 'country/culture', route: '/country/culture', title: 'Country Culture', description: 'Stories, playlist, House Rules', group: 'Country', icon: Music, component: CountryCulture, parentSlug: 'country', property: 'country',
    seo: { include: true, defaultTitle: 'Culture | Crazy Bear Country', defaultDescription: 'Culture at Crazy Bear Country.' } },

  // ─── Town ─────────────────────────────────────────────────────
  { slug: 'town', route: '/town', title: 'Town Home', description: 'Beaconsfield landing', group: 'Town', icon: Building2, component: TownHome, property: 'town',
    seo: { include: true, defaultTitle: 'Crazy Bear Town | Beaconsfield', defaultDescription: 'Crazy Bear Town at Beaconsfield.' } },
  { slug: 'town/food', route: '/town/food', title: 'Town Food', description: 'Black Bear, B&B, Hom Thai', group: 'Town', icon: UtensilsCrossed, component: TownFood, parentSlug: 'town', property: 'town',
    seo: { include: true, defaultTitle: 'Food | Crazy Bear Town', defaultDescription: 'Food at Crazy Bear Town.' } },
  { slug: 'town/food/black-bear', route: '/town/food/black-bear', title: 'The Black Bear', description: 'Black Bear restaurant', group: 'Town', icon: UtensilsCrossed, component: TownBlackBear, parentSlug: 'town/food', property: 'town',
    seo: { include: true, defaultTitle: 'The Black Bear | Crazy Bear Town', defaultDescription: 'The Black Bear at Crazy Bear Town.' } },
  { slug: 'town/food/bnb', route: '/town/food/bnb', title: 'The B&B', description: 'The B&B', group: 'Town', icon: UtensilsCrossed, component: TownBnB, parentSlug: 'town/food', property: 'town',
    seo: { include: true, defaultTitle: 'The B&B | Crazy Bear Town', defaultDescription: 'The B&B at Crazy Bear Town.' } },
  { slug: 'town/food/hom-thai', route: '/town/food/hom-thai', title: 'Hom Thai', description: 'Hom Thai', group: 'Town', icon: UtensilsCrossed, component: TownHomThai, parentSlug: 'town/food', property: 'town',
    seo: { include: true, defaultTitle: 'Hom Thai | Crazy Bear Town', defaultDescription: 'Hom Thai at Crazy Bear Town.' } },
  { slug: 'town/drink', route: '/town/drink', title: 'Town Drink', description: 'Bars and cocktails', group: 'Town', icon: Wine, component: TownDrink, parentSlug: 'town', property: 'town',
    seo: { include: true, defaultTitle: 'Drink | Crazy Bear Town', defaultDescription: 'Drinks at Crazy Bear Town.' } },
  { slug: 'town/drink/cocktails', route: '/town/drink/cocktails', title: 'Cocktails', description: 'Town cocktails', group: 'Town', icon: Martini, component: TownCocktails, parentSlug: 'town/drink', property: 'town',
    seo: { include: true, defaultTitle: 'Cocktails | Crazy Bear Town', defaultDescription: 'Cocktails at Crazy Bear Town.' } },
  { slug: 'town/rooms', route: '/town/rooms', title: 'Town Rooms', description: 'Bedrooms and gallery', group: 'Town', icon: Bed, component: TownRooms, parentSlug: 'town', property: 'town',
    seo: { include: true, defaultTitle: 'Rooms | Crazy Bear Town', defaultDescription: 'Rooms at Crazy Bear Town.' } },
  { slug: 'town/rooms/types', route: '/town/rooms/types', title: 'Room Types', description: 'Town room types', group: 'Town', icon: Bed, component: TownRoomTypes, parentSlug: 'town/rooms', property: 'town',
    seo: { include: true, defaultTitle: 'Room Types | Crazy Bear Town', defaultDescription: 'Room types at Crazy Bear Town.' } },
  { slug: 'town/rooms/gallery', route: '/town/rooms/gallery', title: 'Room Gallery', description: 'Town room gallery', group: 'Town', icon: ImageIcon, component: TownRoomGallery, parentSlug: 'town/rooms', property: 'town',
    seo: { include: true, defaultTitle: 'Gallery | Crazy Bear Town', defaultDescription: 'Room gallery at Crazy Bear Town.' } },
  { slug: 'town/pool', route: '/town/pool', title: 'Town Pool', description: 'Hidden pool', group: 'Town', icon: Waves, component: TownPool, parentSlug: 'town', property: 'town',
    seo: { include: true, defaultTitle: 'The Pool | Crazy Bear Town', defaultDescription: 'The hidden pool at Crazy Bear Town.' } },
  { slug: 'town/culture', route: '/town/culture', title: 'Town Culture', description: 'Stories, playlist, House Rules', group: 'Town', icon: Music, component: TownCulture, parentSlug: 'town', property: 'town',
    seo: { include: true, defaultTitle: 'Culture | Crazy Bear Town', defaultDescription: 'Culture at Crazy Bear Town.' } },

  // ─── Global content (no public route, edited in CMS only) ─────
  { slug: 'global/footer', route: '__global/footer', title: 'Footer', description: 'Site-wide footer', group: 'Global', icon: FileText, component: CMSFooterPreview,
    seo: { include: false, defaultTitle: '', defaultDescription: '' } },
  { slug: 'global/navigation', route: '__global/navigation', title: 'Navigation', description: 'Site-wide navigation', group: 'Global', icon: Globe, component: CMSNavigationPreview,
    seo: { include: false, defaultTitle: '', defaultDescription: '' } },
  { slug: 'global/email-templates', route: '__global/email-templates', title: 'Email Templates', description: 'Transactional email templates', group: 'Global', icon: Mail, component: CMSEmailTemplates,
    seo: { include: false, defaultTitle: '', defaultDescription: '' } },
];

/**
 * Routes that exist in App.tsx but are intentionally NOT in the CMS.
 * The build-time check uses this list to know what to ignore.
 *
 * Categories: redirects, member-only, utility/admin, parametric routes,
 * SecretKitchens, alias routes.
 */
export const CMS_EXCLUDED_ROUTES: string[] = [
  '/image-picker',
  '/set-password',
  '/croft', // legacy alias to old Croft Common index
  '/research',
  '/enquire',
  '/profile',
  '/notifications',
  '/uncommon-standards',
  '/ext',
  '/secretkitchens',
  '/secretkitchenadmin',
  '/check-in',
  '/calendar',
  '/manage-event/:token',
  '/unsubscribe',
  '/branding',
  '/push-setup',
  '/croft-common-datetime',
  '/CroftCommonDate&Time',
  '/CroftCommonDateTime',
  '/croftcommondatetime',
  // Members-only Den routes (excluded per scope decision)
  '/den',
  '/den/main',
  '/den/member',
  '/den/member/lunch-run',
  '/den/member/ledger',
  '/den/member/profile',
  '/den/member/dashboard',
  '/den/member/moments',
  '/den/member/gold',
  '/den/verify',
  // Common-room redirects
  '/common-room',
  '/common-room/main',
  '/common-room/member',
  '/common-room/member/lunch-run',
  '/common-room/member/ledger',
  '/common-room/member/profile',
  '/common-room/member/dashboard',
  '/common-room/member/moments',
  // Admin redirects
  '/admin/*',
  '/admin/member-analytics',
  '/admin/member-analytics-legacy',
  '/cms/login',
  // Country/Town nested members redirects
  '/country/members',
  '/town/members',
];

export const CMS_PAGES_BY_SLUG: Record<string, CmsPageEntry> = Object.fromEntries(
  CMS_PAGES.map((p) => [p.slug, p])
);

export const CMS_PAGES_BY_ROUTE: Record<string, CmsPageEntry> = Object.fromEntries(
  CMS_PAGES.filter((p) => !p.route.startsWith('__')).map((p) => [p.route, p])
);

export const CMS_PAGES_BY_GROUP: Record<CmsPageGroup, CmsPageEntry[]> = CMS_PAGES.reduce(
  (acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  },
  {} as Record<CmsPageGroup, CmsPageEntry[]>
);

/** Children of a parent slug, ordered as defined in CMS_PAGES. */
export function childrenOf(parentSlug: string): CmsPageEntry[] {
  return CMS_PAGES.filter((p) => p.parentSlug === parentSlug);
}

/** Top-level pages for a group (no parentSlug). */
export function topLevelOf(group: CmsPageGroup): CmsPageEntry[] {
  return CMS_PAGES.filter((p) => p.group === group && !p.parentSlug);
}
