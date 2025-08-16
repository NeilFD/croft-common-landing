import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImportStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  error?: string;
}

const ImportManager = () => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ImportStep[]>([
    {
      id: 'content',
      name: 'Import Page Content',
      description: 'Headlines, descriptions, and text content from all pages',
      completed: false,
    },
    {
      id: 'images',
      name: 'Import Hero Images',
      description: 'All carousel images with metadata and descriptions',
      completed: false,
    },
    {
      id: 'brand',
      name: 'Import Brand Assets',
      description: 'Logos, fonts, and brand elements',
      completed: false,
    },
    {
      id: 'design',
      name: 'Import Design Tokens',
      description: 'Colors, spacing, and design system variables',
      completed: false,
    },
  ]);

  const updateStep = (id: string, completed: boolean, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, completed, error } : step
    ));
  };

  const importContent = async () => {
    if (!user) {
      updateStep('content', false, 'User not authenticated');
      return;
    }

    try {
      setProgress(25);
      
      console.log('🔄 Starting content import with user:', user.id);
      console.log('🔄 User email:', user.email);
      
      // Test authentication and permissions first
      const { data: testData, error: testError } = await supabase
        .from('cms_content')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Permission test failed:', testError);
        updateStep('content', false, `Permission error: ${testError.message}`);
        return;
      }
      
      console.log('✅ Permission test passed');
      
      // Import comprehensive page content from existing site
      const contentData = [
        // Index/Home page
        {
          page: 'index',
          section: 'hero',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'CROFT COMMON' },
          created_by: user.id,
        },
        {
          page: 'index',
          section: 'hero',
          content_key: 'subtitle',
          content_type: 'text' as const,
          content_data: { text: 'Members Club & Cultural Hub' },
          created_by: user.id,
        },
        
        // Beer page
        {
          page: 'beer',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'BEER' },
          created_by: user.id,
        },
        {
          page: 'beer',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Steel lines. Long tables. Cold pints. No pretence, we\'re all friends, warm sounds.\n\nBig heart.' 
          },
          created_by: user.id,
        },
        
        // Cafe page - REAL CONTENT
        {
          page: 'cafe',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'CAFÉ' },
          created_by: user.id,
        },
        {
          page: 'cafe',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Open early. Concrete counters. Black coffee. Warm light. A place to meet, A place to work, A place to linger.\n\nMusic & movement.' 
          },
          created_by: user.id,
        },
        
        // Cocktails page - REAL CONTENT
        {
          page: 'cocktails',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'COCKTAILS' },
          created_by: user.id,
        },
        {
          page: 'cocktails',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Lights down. Bottles up. Zinc Top. Sharp drinks. Soft shadows. Built for late.\n\nVibe' 
          },
          created_by: user.id,
        },
        
        // Hall page
        {
          page: 'hall',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'HALL' },
          created_by: user.id,
        },
        {
          page: 'hall',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life\'s big moments.\n\nStrip it back. Fill it up.' 
          },
          created_by: user.id,
        },
        
        // Kitchens page - REAL CONTENT
        {
          page: 'kitchens',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'KITCHENS' },
          created_by: user.id,
        },
        {
          page: 'kitchens',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Four vendors. Four flavours. Food when ready. Simple.\n\nNoise, heat, and shared tables.' 
          },
          created_by: user.id,
        },
        
        // Community page - REAL CONTENT
        {
          page: 'community',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'COMMON GROUND' },
          created_by: user.id,
        },
        {
          page: 'community',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'A space where creativity meets conscience. Where community investment drives positive change.' 
          },
          created_by: user.id,
        },
        
        // Common Room page
        {
          page: 'common-room',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'COMMON ROOM' },
          created_by: user.id,
        },
        {
          page: 'common-room',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Flexible workspace. Quiet focus. Comfortable seating. Where productivity meets community.\n\nWork reimagined.' 
          },
          created_by: user.id,
        },
      ];

      console.log('📝 Attempting to insert content data:', contentData.length, 'items');

      const { error: contentError } = await supabase
        .from('cms_content')
        .upsert(contentData, { 
          onConflict: 'page,section,content_key',
          ignoreDuplicates: false 
        });

      if (contentError) {
        console.error('❌ Content import error:', contentError);
        throw contentError;
      }
      
      console.log('✅ Content import successful');
      updateStep('content', true);

    } catch (error) {
      console.error('❌ Import content failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import content';
      updateStep('content', false, errorMessage);
      throw error;
    }
  };

  const importImages = async () => {
    if (!user) return;

    try {
      setProgress(50);

      // Import ALL hero images from existing site data
      const imageData = [
        // Home hero images - ALL 4 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'index',
          carousel_name: 'home_hero',
          title: 'Home Hero Image 1',
          description: 'Dark industrial interior with warm lighting',
          image_url: '/lovable-uploads/554a5ea5-4c34-4b71-971b-a896a47f8927.png',
          alt_text: 'Croft Common dark interior with industrial design',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'index',
          carousel_name: 'home_hero',
          title: 'Home Hero Image 2',
          description: 'Warm community space',
          image_url: '/lovable-uploads/2cf25417-28ae-479d-b6b8-19e126392333.png',
          alt_text: 'Warm community gathering space',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'index',
          carousel_name: 'home_hero',
          title: 'Home Hero Image 3',
          description: 'Modern workspace interior',
          image_url: '/lovable-uploads/64b7fab3-00a9-4045-9318-590eb75f1336.png',
          alt_text: 'Modern collaborative workspace',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'index',
          carousel_name: 'home_hero',
          title: 'Home Hero Image 4',
          description: 'Mixed lighting workspace',
          image_url: '/lovable-uploads/5d1d2f5e-37ba-44a7-a95f-ec6970e2eaaf.png',
          alt_text: 'Workspace with mixed lighting',
          sort_order: 4,
          created_by: user.id,
        },
        
        // Beer hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 1',
          description: 'Industrial bar area with steel and concrete',
          image_url: '/lovable-uploads/a6fcbd2e-334d-49e3-9b5d-d7dd0e87d852.png',
          alt_text: 'Industrial beer bar with steel fixtures',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 2',
          description: 'Long tables and bar setup',
          image_url: '/lovable-uploads/3a5090a3-760f-4496-8672-bd8724569325.png',
          alt_text: 'Long communal tables in beer area',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 3',
          description: 'Dark beer hall atmosphere',
          image_url: '/lovable-uploads/9ef0b073-9f25-420b-8d75-fb90540706d3.png',
          alt_text: 'Dark atmospheric beer hall',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 4',
          description: 'Warm beer hall lighting',
          image_url: '/lovable-uploads/25105870-85fb-442c-9d85-ee7e218df672.png',
          alt_text: 'Warm beer hall atmosphere',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 5',
          description: 'Industrial beer space design',
          image_url: '/lovable-uploads/1b15e13f-fb17-4f03-a1d9-9a7c2a2611b3.png',
          alt_text: 'Industrial beer space interior',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero 6',
          description: 'Warm beer space environment',
          image_url: '/lovable-uploads/a7f9a44b-d4bc-48db-bf2c-7440227a4b1e.png',
          alt_text: 'Warm beer environment',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Cafe hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 1',
          description: 'Natural light coffee space',
          image_url: '/lovable-uploads/0a0894f9-a169-4747-9282-2150f198561c.png',
          alt_text: 'Bright cafe space with natural lighting',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 2',
          description: 'Coffee counter and seating',
          image_url: '/lovable-uploads/544efa64-6a2b-4db8-ba10-4da2954a97da.png',
          alt_text: 'Coffee counter with comfortable seating',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 3',
          description: 'Dark cafe interior atmosphere',
          image_url: '/lovable-uploads/e6f7674f-71d0-4ec4-8782-a283ed5ba5b5.png',
          alt_text: 'Dark atmospheric cafe interior',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 4',
          description: 'Warm cafe environment',
          image_url: '/lovable-uploads/9110aec8-9e43-43ad-b701-6d4948d1f48b.png',
          alt_text: 'Warm cafe environment',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 5',
          description: 'Dark cafe seating area',
          image_url: '/lovable-uploads/0726808b-f108-44ac-bc6c-12c7eead462a.png',
          alt_text: 'Dark cafe seating area',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cafe',
          carousel_name: 'cafe_hero',
          title: 'Cafe Section Hero 6',
          description: 'Warm cafe space with natural light',
          image_url: '/lovable-uploads/e5c78d77-a685-4c5c-ab4a-2968bde2a0de.png',
          alt_text: 'Warm cafe with natural lighting',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Cocktails hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 1',
          description: 'Intimate cocktail bar atmosphere',
          image_url: '/lovable-uploads/8dc68acd-38ac-4910-a909-716d78b1d187.png',
          alt_text: 'Intimate cocktail bar with warm lighting',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 2',
          description: 'Sophisticated bar setup',
          image_url: '/lovable-uploads/19074a8e-e1ee-4793-8c75-c60bd7818a99.png',
          alt_text: 'Sophisticated cocktail preparation area',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 3',
          description: 'Warm cocktail lounge',
          image_url: '/lovable-uploads/ada4b655-67e6-4bbe-8e52-ea2d407da312.png',
          alt_text: 'Warm cocktail lounge area',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 4',
          description: 'Dark cocktail bar environment',
          image_url: '/lovable-uploads/0c4a9d3f-d5a3-4a01-85fb-ed3f272a821f.png',
          alt_text: 'Dark cocktail bar interior',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 5',
          description: 'Elegant cocktail service area',
          image_url: '/lovable-uploads/644b4e2a-eb1b-4d76-a734-f012e7d69379.png',
          alt_text: 'Elegant cocktail service area',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'cocktails',
          carousel_name: 'cocktail_hero',
          title: 'Cocktails Section Hero 6',
          description: 'Premium cocktail bar setup',
          image_url: '/lovable-uploads/4a785c1a-4ea4-4874-b47e-24c5c2611368.png',
          alt_text: 'Premium cocktail bar setup',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Hall hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 1',
          description: 'Empty event space ready for transformation',
          image_url: '/lovable-uploads/4d7c9143-3421-4c65-9601-29c65667740a.png',
          alt_text: 'Empty hall space with industrial architecture',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 2',
          description: 'Event space in use',
          image_url: '/lovable-uploads/834974e6-ab56-4571-946b-b3b09c2ee678.png',
          alt_text: 'Hall space during an event',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 3',
          description: 'Dark hall event setup',
          image_url: '/lovable-uploads/b64216a3-dd09-4428-a328-02343a5f2a23.png',
          alt_text: 'Dark hall event configuration',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 4',
          description: 'Light hall space configuration',
          image_url: '/lovable-uploads/fdbc71f5-00d7-4da2-af28-8626b224ec5b.png',
          alt_text: 'Light hall space setup',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 5',
          description: 'Mixed lighting hall setup',
          image_url: '/lovable-uploads/5d770f71-d0ac-45ef-b72f-b853c4020425.png',
          alt_text: 'Hall with mixed lighting setup',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'hall',
          carousel_name: 'hall_hero',
          title: 'Hall Section Hero 6',
          description: 'Multi-purpose hall configuration',
          image_url: '/lovable-uploads/90bb8b43-c5a1-41ba-ac44-1ea3c8109e07.png',
          alt_text: 'Multi-purpose hall space',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Kitchens hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 1',
          description: 'Professional kitchen workspace',
          image_url: '/lovable-uploads/7a67832c-682c-437c-80c0-30edc2a10f56.png',
          alt_text: 'Professional kitchen with steel equipment',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 2',
          description: 'Industrial cooking space',
          image_url: '/lovable-uploads/5101ed7f-1323-4112-82b4-a09d6d501a36.png',
          alt_text: 'Industrial kitchen workspace',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 3',
          description: 'Warm kitchen environment',
          image_url: '/lovable-uploads/8ea5b295-7d10-4aeb-a64c-b646f4046ee2.png',
          alt_text: 'Warm kitchen workspace',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 4',
          description: 'Mixed lighting kitchen space',
          image_url: '/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png',
          alt_text: 'Kitchen with mixed lighting',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 5',
          description: 'Industrial kitchen design',
          image_url: '/lovable-uploads/0d977d16-788f-4f60-9f33-fd2086b66430.png',
          alt_text: 'Industrial kitchen design',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'kitchens',
          carousel_name: 'kitchen_hero',
          title: 'Kitchens Section Hero 6',
          description: 'Dark kitchen workspace',
          image_url: '/lovable-uploads/d267ef73-2a5d-4bdd-9f73-63f8c364077f.png',
          alt_text: 'Dark kitchen workspace',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Community hero images - ALL 6 IMAGES
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 1',
          description: 'Community gathering space',
          image_url: '/lovable-uploads/2a013145-1125-485a-bc81-556ddb550540.png',
          alt_text: 'Community members in shared space',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 2',
          description: 'Collaborative workspace',
          image_url: '/lovable-uploads/dc15ca32-0829-46a6-9db5-897ebaafaff9.png',
          alt_text: 'Collaborative community workspace',
          sort_order: 2,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 3',
          description: 'Community event space',
          image_url: '/lovable-uploads/ff58d7a5-7fae-4492-9f4f-02cf1c93e8a1.png',
          alt_text: 'Community event gathering',
          sort_order: 3,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 4',
          description: 'Social community area',
          image_url: '/lovable-uploads/a20baf5a-8e8f-41ea-82f5-1801dbd32dd7.png',
          alt_text: 'Social community gathering area',
          sort_order: 4,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 5',
          description: 'Community collaboration space',
          image_url: '/lovable-uploads/2c2e175f-be6b-4df7-a725-47d558a35cd8.png',
          alt_text: 'Community collaboration area',
          sort_order: 5,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'community',
          carousel_name: 'community_hero',
          title: 'Community Section Hero 6',
          description: 'Community shared workspace',
          image_url: '/lovable-uploads/4bafb73c-74e5-4bf4-ba9e-34097a0137cf.png',
          alt_text: 'Community shared workspace',
          sort_order: 6,
          created_by: user.id,
        },
        
        // Common Room hero images
        {
          asset_type: 'hero_image' as const,
          page: 'common-room',
          carousel_name: 'common_room_hero',
          title: 'Common Room Section Hero',
          description: 'Flexible workspace and meeting area',
          image_url: '/lovable-uploads/322fb5be-0402-4d55-8a72-b5e9c3253eef.png',
          alt_text: 'Common room with flexible seating arrangements',
          sort_order: 1,
          created_by: user.id,
        },
      ];

      const { error: imageError } = await supabase
        .from('cms_images')
        .upsert(imageData, { 
          onConflict: 'image_url,page,carousel_name',
          ignoreDuplicates: false 
        });

      if (imageError) throw imageError;
      updateStep('images', true);

    } catch (error) {
      updateStep('images', false, error instanceof Error ? error.message : 'Failed to import images');
      throw error;
    }
  };

  const importBrandAssets = async () => {
    if (!user) return;

    try {
      setProgress(75);

      const brandData = [
        {
          asset_key: 'primary_logo',
          asset_type: 'logo',
          asset_value: '/brand/logo.png',
          description: 'Primary Croft Common logo',
          created_by: user.id,
        },
        {
          asset_key: 'brand_name',
          asset_type: 'text',
          asset_value: 'Croft Common',
          description: 'Brand name',
          created_by: user.id,
        },
        {
          asset_key: 'primary_font',
          asset_type: 'font',
          asset_value: 'Oswald',
          description: 'Primary brutalist font for headlines',
          created_by: user.id,
        },
        {
          asset_key: 'secondary_font',
          asset_type: 'font',
          asset_value: 'Work Sans',
          description: 'Secondary industrial font for body text',
          created_by: user.id,
        },
      ];

      const { error: brandError } = await supabase
        .from('cms_brand_assets')
        .upsert(brandData, { 
          onConflict: 'asset_key,asset_type',
          ignoreDuplicates: false 
        });

      if (brandError) throw brandError;
      updateStep('brand', true);

    } catch (error) {
      updateStep('brand', false, error instanceof Error ? error.message : 'Failed to import brand assets');
      throw error;
    }
  };

  const importDesignTokens = async () => {
    if (!user) return;

    try {
      setProgress(90);

      // Import comprehensive design tokens from existing CSS
      const designTokens = [
        // Core palette
        {
          token_key: 'background',
          token_type: 'color',
          token_value: '0 0% 100%',
          css_variable: '--background',
          description: 'Primary background color',
          created_by: user.id,
        },
        {
          token_key: 'foreground',
          token_type: 'color',
          token_value: '0 0% 0%',
          css_variable: '--foreground',
          description: 'Primary text color',
          created_by: user.id,
        },
        {
          token_key: 'primary',
          token_type: 'color',
          token_value: '0 0% 0%',
          css_variable: '--primary',
          description: 'Primary brand color',
          created_by: user.id,
        },
        
        // Industrial palette
        {
          token_key: 'surface',
          token_type: 'color',
          token_value: '0 0% 98%',
          css_variable: '--surface',
          description: 'Light surface color',
          created_by: user.id,
        },
        {
          token_key: 'surface_dark',
          token_type: 'color',
          token_value: '0 0% 8%',
          css_variable: '--surface-dark',
          description: 'Dark surface color',
          created_by: user.id,
        },
        {
          token_key: 'concrete',
          token_type: 'color',
          token_value: '0 0% 85%',
          css_variable: '--concrete',
          description: 'Concrete grey color',
          created_by: user.id,
        },
        {
          token_key: 'steel',
          token_type: 'color',
          token_value: '0 0% 40%',
          css_variable: '--steel',
          description: 'Steel grey color',
          created_by: user.id,
        },
        {
          token_key: 'charcoal',
          token_type: 'color',
          token_value: '0 0% 15%',
          css_variable: '--charcoal',
          description: 'Charcoal dark grey',
          created_by: user.id,
        },
        {
          token_key: 'void',
          token_type: 'color',
          token_value: '0 0% 5%',
          css_variable: '--void',
          description: 'Deep void black',
          created_by: user.id,
        },
        
        // Accent colors
        {
          token_key: 'accent_pink',
          token_type: 'color',
          token_value: '350 80% 65%',
          css_variable: '--accent-pink',
          description: 'Pink accent color',
          created_by: user.id,
        },
        {
          token_key: 'accent_lime',
          token_type: 'color',
          token_value: '85 80% 55%',
          css_variable: '--accent-lime',
          description: 'Lime green accent for cocktails',
          created_by: user.id,
        },
        {
          token_key: 'accent_orange',
          token_type: 'color',
          token_value: '22 100% 55%',
          css_variable: '--accent-orange',
          description: 'Bright orange accent for beer',
          created_by: user.id,
        },
        {
          token_key: 'accent_blood_red',
          token_type: 'color',
          token_value: '0 100% 35%',
          css_variable: '--accent-blood-red',
          description: 'Blood red accent for kitchens',
          created_by: user.id,
        },
        {
          token_key: 'accent_electric_blue',
          token_type: 'color',
          token_value: '194 100% 50%',
          css_variable: '--accent-electric-blue',
          description: 'Electric blue accent for community',
          created_by: user.id,
        },
        {
          token_key: 'accent_vivid_purple',
          token_type: 'color',
          token_value: '261 80% 57%',
          css_variable: '--accent-vivid-purple',
          description: 'Vivid purple accent for hall',
          created_by: user.id,
        },
        {
          token_key: 'accent_sage_green',
          token_type: 'color',
          token_value: '120 25% 55%',
          css_variable: '--accent-sage-green',
          description: 'Sage green accent for common room',
          created_by: user.id,
        },
        
        // Typography
        {
          token_key: 'font_brutalist',
          token_type: 'font',
          token_value: 'Oswald, Arial Black, Helvetica, sans-serif',
          css_variable: '--font-brutalist',
          description: 'Brutalist font for headlines',
          created_by: user.id,
        },
        {
          token_key: 'font_industrial',
          token_type: 'font',
          token_value: 'Work Sans, Arial, Helvetica, sans-serif',
          css_variable: '--font-industrial',
          description: 'Industrial font for body text',
          created_by: user.id,
        },
        
        // Spacing
        {
          token_key: 'border_radius',
          token_type: 'spacing',
          token_value: '0',
          css_variable: '--radius',
          description: 'Border radius (brutalist = no radius)',
          created_by: user.id,
        },
      ];

      const { error: designError } = await supabase
        .from('cms_design_tokens')
        .upsert(designTokens, { 
          onConflict: 'token_key,token_type',
          ignoreDuplicates: false 
        });

      if (designError) throw designError;
      updateStep('design', true);
      setProgress(100);

    } catch (error) {
      updateStep('design', false, error instanceof Error ? error.message : 'Failed to import design tokens');
      throw error;
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);

    try {
      await importContent();
      await importImages();
      await importBrandAssets();
      await importDesignTokens();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const allCompleted = steps.every(step => step.completed);
  const hasErrors = steps.some(step => step.error);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Current Site Content
          </CardTitle>
          <p className="text-muted-foreground">
            This will import all existing content, images, and design elements into the CMS for immediate editing.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing content...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="mt-0.5">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : step.error ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="h-5 w-5 border-2 rounded-full border-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.name}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{step.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {allCompleted ? (
                <span className="text-green-600">✓ Import completed successfully</span>
              ) : hasErrors ? (
                <span className="text-destructive">Some imports failed</span>
              ) : (
                'Ready to import existing content'
              )}
            </div>
            <Button 
              onClick={handleImport} 
              disabled={importing || allCompleted || !user}
              className="ml-auto"
            >
              {!user ? 'Login Required' : importing ? 'Importing...' : allCompleted ? 'Import Complete' : 'Start Import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {allCompleted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Import complete! You can now edit content, images, and brand assets from the respective tabs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImportManager;