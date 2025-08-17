import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  type?: string;
  url: string;
}

const baseKeywords = [
  'Croft Common',
  'restaurant',
  'bar',
  'community space',
  'craft beer',
  'cocktails',
  'events',
  'food',
  'dining',
  'local business',
  'UK restaurant'
];

const pageSEOData: Record<string, Partial<SEOData>> = {
  '/': {
    title: 'Croft Common - Community Space, Restaurant & Bar',
    description: 'Discover Croft Common, your vibrant community space offering exceptional food, craft beer, cocktails, and memorable events. Join our welcoming community today.',
    keywords: [...baseKeywords, 'home', 'main', 'welcome', 'community hub'],
    type: 'website'
  },
  '/cafe': {
    title: 'Cafe - Fresh Coffee & Light Bites | Croft Common',
    description: 'Start your day at Croft Common\'s cafe with freshly brewed coffee, artisanal pastries, and light bites in a welcoming community atmosphere.',
    keywords: [...baseKeywords, 'cafe', 'coffee', 'breakfast', 'pastries', 'light bites', 'morning'],
    type: 'restaurant'
  },
  '/cocktails': {
    title: 'Craft Cocktails & Premium Spirits | Croft Common',
    description: 'Experience expertly crafted cocktails and premium spirits at Croft Common. Our skilled bartenders create exceptional drinks in a vibrant atmosphere.',
    keywords: [...baseKeywords, 'cocktails', 'spirits', 'bartender', 'drinks', 'evening', 'nightlife'],
    type: 'restaurant'
  },
  '/beer': {
    title: 'Craft Beer & Traditional Ales | Croft Common',
    description: 'Discover our carefully curated selection of craft beers and traditional ales. Steel lines, long tables, cold pints, and warm sounds at Croft Common.',
    keywords: [...baseKeywords, 'beer', 'ales', 'brewery', 'pub', 'craft beer', 'traditional'],
    type: 'restaurant'
  },
  '/kitchens': {
    title: 'Kitchen & Dining Experience | Croft Common',
    description: 'Savor exceptional cuisine at Croft Common\'s kitchen. Fresh ingredients, skilled chefs, and a menu that celebrates both tradition and innovation.',
    keywords: [...baseKeywords, 'kitchen', 'dining', 'menu', 'chef', 'cuisine', 'fresh ingredients'],
    type: 'restaurant'
  },
  '/hall': {
    title: 'Event Hall & Private Dining | Croft Common',
    description: 'Host your special events in Croft Common\'s versatile hall. Perfect for private dining, celebrations, meetings, and community gatherings.',
    keywords: [...baseKeywords, 'hall', 'events', 'private dining', 'celebrations', 'meetings', 'venue'],
    type: 'place'
  },
  '/common-room': {
    title: 'Common Room - Relaxed Social Space | Croft Common',
    description: 'Unwind in our comfortable common room, perfect for casual meetings, reading, working, or simply enjoying the company of friends and community.',
    keywords: [...baseKeywords, 'common room', 'social space', 'relaxed', 'meetings', 'community'],
    type: 'place'
  },
  '/community': {
    title: 'Community Hub & Local Connection | Croft Common',
    description: 'Join the Croft Common community! Discover local connections, community messages, and be part of something bigger in our vibrant neighborhood.',
    keywords: [...baseKeywords, 'community hub', 'local connection', 'neighborhood', 'social impact'],
    type: 'organization'
  },
  '/calendar': {
    title: 'Events Calendar | Croft Common',
    description: 'Stay updated with upcoming events at Croft Common. From live music and community gatherings to special dining experiences and celebrations.',
    keywords: [...baseKeywords, 'calendar', 'events', 'live music', 'gatherings', 'schedule'],
    type: 'event'
  },
  '/notifications': {
    title: 'Stay Connected - Notifications | Croft Common',
    description: 'Stay in the loop with Croft Common notifications. Get updates about events, special offers, menu changes, and community news.',
    keywords: [...baseKeywords, 'notifications', 'updates', 'news', 'offers', 'stay connected'],
    type: 'webapp'
  }
};

export const useSEO = (customData?: Partial<SEOData>) => {
  const location = useLocation();
  
  const seoData = useMemo(() => {
    const currentPath = location.pathname;
    const pageData = pageSEOData[currentPath] || pageSEOData['/'];
    
    const baseUrl = 'https://croftcommon.co.uk';
    const fullUrl = baseUrl + currentPath;
    
    return {
      title: pageData.title || 'Croft Common',
      description: pageData.description || 'A vibrant community space offering exceptional food, craft beer, cocktails, and events.',
      keywords: pageData.keywords || baseKeywords,
      image: pageData.image || `${baseUrl}/brand/logo.png`,
      type: pageData.type || 'website',
      url: fullUrl,
      ...customData
    };
  }, [location.pathname, customData]);

  return seoData;
};

export const usePageKeywords = (additionalKeywords: string[] = []) => {
  const location = useLocation();
  
  return useMemo(() => {
    const pageData = pageSEOData[location.pathname];
    const keywords = pageData?.keywords || baseKeywords;
    return [...keywords, ...additionalKeywords];
  }, [location.pathname, additionalKeywords]);
};