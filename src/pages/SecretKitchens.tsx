import React, { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import CroftLogo from '@/components/CroftLogo';
import { LandingSlide } from '@/components/slides/LandingSlide';
import { HeroSlide } from '@/components/slides/HeroSlide';
import { LeftAlignedSlide } from '@/components/slides/LeftAlignedSlide';
import { RightAlignedSlide } from '@/components/slides/RightAlignedSlide';
import { CenteredSlide } from '@/components/slides/CenteredSlide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ThreeColumnSlide } from '@/components/slides/ThreeColumnSlide';
import { GallerySlide } from '@/components/slides/GallerySlide';
import { ListSlide } from '@/components/slides/ListSlide';
import { HalfScreenSlide } from '@/components/slides/HalfScreenSlide';
import { SplitLayoutSlide } from '@/components/slides/SplitLayoutSlide';
import { ImageTextSlide } from '@/components/slides/ImageTextSlide';
import { PlainImageSlide } from '@/components/slides/PlainImageSlide';
import { TaproomSlide } from '@/components/slides/TaproomSlide';
import { SplitLayoutWithTitleSlide } from '@/components/slides/SplitLayoutWithTitleSlide';
import { CourtyardSlide } from '@/components/slides/CourtyardSlide';
import { QuestionnaireSlide } from '@/components/slides/QuestionnaireSlide';
import { Users, Utensils, Star, Clock, MapPin, Mail, Phone, Crown, Zap, Award, Menu, LogOut, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { AudioProvider, useAudio } from '@/contexts/AudioContext';
import MasterAudioControl from '@/components/MasterAudioControl';
import { StyledNavigationDropdown } from '@/components/ui/StyledNavigationDropdown';
import { TransparentCarouselArrows } from '@/components/ui/TransparentCarouselArrows';
import { MobileNavigationMenu } from '@/components/ui/MobileNavigationMenu';
import { MobileCarouselControls } from '@/components/ui/MobileCarouselControls';
import { cn } from '@/lib/utils';
import SecretKitchensCountdown from '@/components/SecretKitchensCountdown';

// Navigation labels for dropdown (max 3 words each)
const slideNavigationLabels = [
  'Welcome',
  'Croft Common',
  'Neighbourhood Energy',
  'Tenant Opportunity',
  'Trading Made Easy',
  'Promotion & Positioning',
  'Welcome Croft Common',
  'Stokes Croft Energy',
  'Venue Spaces',
  'Café & Bar',
  'Morning to Night',
  'Street Terrace',
  'Coffee Preparation',
  'Industrial Loft',
  'The Kitchens',
  'Independent Kitchens',
  'Hospitality Experience',
  'The Taproom',
  'Craft Beer Experience',
  'The Courtyard',
  'Courtyard Details',
  'The Hall',
  'Hall Interior',
  'Hall Corridor',
  'Wedding Venue',
  'Wedding Setup',
  'Event Space',
  'Hall Terrace',
  'The Rooftop',
  'Rooftop Terrace',
  'The Rooftop Bar',
  'Casual Dining',
  'Croft Common Exterior',
  'Vendor Application'
];

// Slide configurations for all slides
const slideConfigs = [
  { type: 'LANDING' },
  { type: 'HERO', title: 'CROFT COMMON', subtitle: 'STOKES CROFT, BRISTOL', backgroundImage: '/lovable-uploads/a20eefb2-138d-41f1-9170-f68dd99a63bc.png', noOverlay: true },
  { type: 'CENTERED', title: 'Rooted in the neighbourhood. Alive with city energy.', subtitle: 'This is Croft Common — where Bristol meets, eats, and stays a little longer than planned...', backgroundColor: 'accent' },
  { 
    type: 'CENTERED', 
    title: 'TENANT OPPORTUNITY PROPOSAL', 
    backgroundColor: 'accent',
    leftContent: "We are pleased to offer a unique opportunity for a small number of exceptional food businesses to take up residence within The Kitchens at Croft Common, launching in February 2026 in the heart of Stokes Croft. Croft Common is a new landmark hospitality venue combining The Kitchens at Croft Common, a Cocktail Bar, Beer Hall, Café, and Event Space, all under one roof across 16,000 square feet.",
    rightContent: "At its core will sit The Kitchens, a four-unit destination for outstanding, independent food, one operated by Croft Common and three reserved for exciting independent vendors. We are seeking operators with a strong local following, a reputation for quality, and a desire to grow their brand without the cost or commitment of taking on their own premises. This is a rare chance to be part of a high-profile launch in a much-loved area, with infrastructure, marketing support and footfall potential already in place."
  },
  { 
    type: 'CENTERED', 
    title: 'TRADING MADE EASY', 
    subtitle: 'Fully equipped kitchens, simple turnover-based rent, flexible licences and dedicated front-of-house support.',
    backgroundColor: 'accent',
    leftContent: "Each operator will be granted a fully fitted kitchen space within the food hall, complete with kitchen equipment, extraction, cold storage and prep facilities. The precise kitchen specifications will be shared upon request, along with plans and full technical documentation. We are covering the cost of the fit-out in full. Operators will be charged a simple turnover rent, set at 20 percent of net sales. There is no base rent. A service charge will also apply, with the amount currently being finalised based on projected operations costs.",
    rightContent: "The Kitchens will be open seven days a week, with trading expected from midday until close each evening. Last orders will typically be around 10pm on weekdays and 11pm on weekends. All vendors will be expected to trade throughout these hours unless a different arrangement is agreed in advance. Croft Common will provide all front of house staff, table runners and bar staff. This means vendors can focus entirely on delivering exceptional food with their own kitchen teams. Orders will be taken via Square POS, with a combination of table service and table ordering using QR codes or NFC tags. We are designing the system to feel seamless and intuitive for customers."
  },
  { 
    type: 'CENTERED', 
    title: 'PROMOTION & POSITIONING', 
    backgroundColor: 'accent',
    leftContent: "Marketing and PR for the venue as a whole will be led by the Team at Croft Common. This includes the initial launch campaign, press outreach, brand partnerships and social media. We will also support each vendor's individual story and aim to foster an atmosphere of collaboration between all parties. Our curatorial approach blends high standards with community roots. We want to bring together a collection of food concepts that are both original and accessible, that reflect the vibrancy of the area while elevating the overall customer experience.",
    rightContent: "If you would like to be considered for one of the three kitchen spaces, we would love to hear from you. We are offering private tours, design walk-throughs and commercial meetings across the coming months. We are also happy to share our projected financials and detailed layout plans.\n\nTo arrange a time to speak or visit the site, please contact:\n\nNeil Fincham-Dukes\nFounding Partner, Croft Common and City & Sanctuary\nneil@cityandsanctuary.com\n\nWe look forward to welcoming the first wave of partners to Croft Common and creating something extraordinary together."
  },
  { type: 'HERO', title: 'WELCOME TO CROFT COMMON.', subtitle: 'A NEW ADDITION TO STOKES CROFT AND MAYBE YOUR NEW FAVOURITE PLACE...', backgroundImage: '/lovable-uploads/b0fe37fa-228e-460f-9c90-99ed660449b6.png' },
  { type: 'HALF_SCREEN', backgroundImage: '/lovable-uploads/a0587370-62e3-43a1-aad1-10c43e42b909.png', content: "Shaped by the streets of Stokes Croft, we've refurbished a landmark building and reimagined it as a space to gather, make, eat, drink, and stay a while. The energy of Stokes Croft has always been there — creative, raw, full of potential. Croft Common is a place that reflects that energy. Somewhere where the atmosphere's easy, the crowd's like-minded, and the experiences just happen.\n\nThis is a venue that moves with you. From weekday mornings to late-night weekends. From spontaneous drop-ins to planned get-togethers. From first coffee to last call.\n\nStart your day with a coffee from The Café, where the counter is piled high with freshly baked breads and pastries from the city's best local bakeries. On your way to work? Grab and go. Or, take a moment — settle in on The Street Terrace and soak up the morning sun as the neighbourhood comes to life.\n\nAs the day unfolds, The Taproom opens its doors, pouring fresh local craft beers. Next door, the Kitchens fire up — a showcase for Bristol's most exciting chefs and emerging foodies, serving up bold flavours and original ideas.\n\nAt the centre of it all is The Courtyard: an open-air space where you can gather with friends over a pint from The Taproom or plates from the kitchens, all under open skies.\n\nAs night falls, The Café shifts gear. The coffee counter clears, the lights dim, and the space transforms into elegant Cocktail bar with a resident DJs setting the tone deep into the night.\n\nUpstairs, an unique event space full of character hosts the city's best moments — from intimate ceremonies to after-hours celebrations. And above it all, Bristol's only rooftop bar invites you to bask in the sun by day and sip cocktails beneath the stars by night." },
  { type: 'LIST', items: ['THE CAFÉ & COCKTAIL BAR', 'THE KITCHENS', 'THE TAPROOM', 'THE HALL & TERRACE', 'THE COURTYARD', 'THE ROOFTOP'], backgroundColor: 'accent' },
  { type: 'HERO', title: 'THE CAFE & COCKTAIL BAR', backgroundImage: '/lovable-uploads/405bb3db-323f-47e0-b0ef-26ef79e890e8.png' },
  { 
    type: 'IMAGE_TEXT', 
    title: 'The engine of Croft Common is The Café & Cocktail Bar, being open for trade from early in the morning until late in the evening.',
    rightTitle: 'FROM MORNING ESPRESSO TO LATE-NIGHT VINYL',
    leftContent: "During the day it's counters will be piled high with tempting pastries, cakes and tarts, along with salads, frittatas, flatbreads and other savoury delights. All food will be made on the premises and all orders will be taken at the counter. People can eat in, grab food to go, or take a moment and enjoy brunch on The Street Terrace.\n\nThe Street Terrace will be a private space, filled with plants under a canvas awning. Fresh and bright in the summer, snug and warm in the winter.\n\nIn a neighbourhood where outdoor seating is hard to come by, the terrace will be a local hotspot, with a lively ambience, attracting locals and passersby to the intrigue of the building.\n\nAs the daytime trade slows, The Café transitions into a Cocktail Bar. The café counter houses the decks, and the music vibe changes. The lighting is dimmed, and the bar counter is lit, ready to serve local spirits and classic cocktails.\n\nOpening is from 7 am every day, except for 10 am on Sunday. Monday to Wednesday it will close at 11 pm, on Thursday at 12am, on Friday and Saturday at 1 am and on Sunday at 11pm.\n\nThe inner and outer space caters for approx. 100 covers with the ability to spill-out into The Courtyard which can accommodate 30 covers.",
    rightImage: '/lovable-uploads/41ae38cd-ab7d-4fea-91e7-cd2dfb8b4b6c.png'
  },
  { type: 'HERO', title: 'THE STREET TERRACE', backgroundImage: '/lovable-uploads/6508d223-d38b-4548-bb78-f79d3adffc41.png', noOverlay: true },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/2501737a-fee4-46b5-bad4-686fc66ed1dd.png', alt: 'Coffee preparation scene' },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/21d8aba5-3872-43e7-828f-83f8f0a1b842.png', alt: 'Industrial loft space with brick walls and large windows' },
  { type: 'HERO', title: 'THE KITCHENS', backgroundImage: '/lovable-uploads/1a48fdb9-99c5-4afa-bc8b-895586d3e5fb.png', noOverlay: true },
  { 
    type: 'IMAGE_TEXT', 
    title: 'INDEPENDENT KITCHENS. COLLECTIVE EXPERIENCE.', 
    rightTitle: 'THE WOODFIRE KITCHEN',
    leftContent: "The Kitchens are where Bristol's boldest food talent comes together under one roof, a curated collection of four kitchens serving up serious flavour and fierce creativity.\n\nFirst off is The Woodfire, our own signature kitchen, built around a glowing wood-fired oven. From morning through to night, it brings depth, drama and flame-fired theatre to every plate, it sets the tone.\n\nSurrounding it are three of Bristol's most exciting food entrepreneurs: up-and-coming street food stars, pop-up pioneers, and cult favourites, each with their own distinct style. From globally inspired comfort food to next-generation brunches, this is a true showcase of Bristol's food scene, independent, inventive and always evolving.\n\nIt's more than a food hall. It's a launchpad for local talent. A place where new ideas meet hungry crowds, where big names get discovered, and where everything, from the food to the fit-out, reflects the creativity of Stokes Croft.\n\nCommunal tables and open kitchens create a space that's vibrant, social and full of energy. Whether you're meeting friends, grabbing lunch solo, or staying for the evening, it's casual dining with serious intent.\n\nOpen daily from 12pm to 10pm, with The Woodfire serving from 7am, this is where Bristol eats - together.\n\nThe Kitchen offer 80 seats, with 100 more in The Café and Cocktail Bar, 30 in The Courtyard, 60 in the Taproom and 80 across the rooftop terraces, all designed to flow effortlessly into one another, creating a flexible, social space where dining, drinking, and gathering come together.",
    rightImage: '/lovable-uploads/71adf12c-12fa-4b43-9a36-2668dee03a18.png'
  },
  { 
    type: 'SPLIT', 
    title: 'TRULY MEMORABLE HOSPITALITY EXPERIENCES INVARIABLY HAVE AN EXTRAORDINARY PEOPLE EXPERIENCE; NATURAL AND GENEROUS HOSPITALITY IS STILL THE KILLER APP.', 
    leftContent: 'TRULY MEMORABLE HOSPITALITY EXPERIENCES INVARIABLY HAVE AN EXTRAORDINARY PEOPLE EXPERIENCE; NATURAL AND GENEROUS HOSPITALITY IS STILL THE KILLER APP.',
    rightImage: '/lovable-uploads/7afc4c37-6fa4-45c5-97eb-63a174938c51.png'
  },
  { 
    type: 'HERO', 
    title: 'THE TAPROOM', 
    subtitle: '', 
    backgroundImage: '/lovable-uploads/a63430da-48b9-4104-b246-fdc7df85f6e6.png' 
  },
  { 
    type: 'TAPROOM', 
    title: 'CASUAL DRINKING BOLD FLAVOURS', 
    leftContent: "Croft Common's aspires to be the heart and soul of our local community with a Taproom serving flavour, variety and provenance.\n\nThe craft beer movement has turned casual drinking into a curated experience. Drinkers aren't loyal to brands anymore, they're loyal to discovery. They want new. They want local. They want beer with character.\n\nCraft beer offers more—more hops, more depth, more everything. One day it's a hazy IPA, the next a crisp pilsner or a bold stout. And behind every beer is a small brewery doing something different.\n\nThat's where we come in.\n\nOur Taproom is designed to be both a social anchor, and a showcase for Bristol's independent beer. The best taprooms aren't about scale; they're about personality. Here, brewers themselves pour the pints, sharing their stories and bringing drinkers closer to the beer. And because great beer deserves great food, you can always grab a burger or snack from the Woodfire & Kitchen to enjoy with your pint.\n\nThe Taproom will be open from 5 pm until 11 pm on Monday to Wednesday. On Thursday it opens at 5 pm and closes at 12am. On Friday it will open at 3pm, closing at 1 am. On Saturdays the Taproom will open from 12 pm until 1 am, with a similar opening time on Sunday, but closing at 11 pm.\n\nThe Taproom space will cater for approx. 80 covers with the ability to spill-out into The Courtyard which can accommodate 30 covers or Onto the rooftop terraces which can accommodate a further 80 covers.",
    rightImage: '/lovable-uploads/62ee9ff9-3f4e-4b23-a404-aeb8949ddbb1.png'
  },
  { 
    type: 'COURTYARD', 
    title: 'THE COURTYARD',
    rightImage: '/lovable-uploads/606af3e3-0044-4849-99c6-926e2dffa563.png'
  },
  { 
    type: 'IMAGE_TEXT',
    title: 'THE COURTYARD. CENTRAL CONNECTION.',
    rightTitle: 'THE COURTYARD',
    leftContent: "The Courtyard is the central space at Croft Common - the entry point and the place everything connects. From here, you can head to The Taproom on the left, or to The Café & Cocktail Bar and The Kitchens on the right.\n\nIt's a space to meet, drift through, or settle into, not tied to any one part of the venue. You can sit anywhere, no matter where you've ordered from. That mix of movement and ease is what makes it work.\n\nThe feel is open and relaxed, with plenty of natural light and greenery. Inspired by the kind of informal courtyards where people naturally gather, it gives you that outside feel, even when you're under cover. In Stokes Croft, where street-side drinks and casual hangouts are part of daily life, the Courtyard fits right in.\n\nBright and sociable during the day, warm and low-lit at night, it's a place to pass through - or stay a while.\n\nThe Courtyard will be open from 7am to 11pm Sunday to Wednesday, until midnight on Thursdays, and right through to 1am on Fridays and Saturdays.\n\nThe space can accommodate for approx. 40 covers, being over spill from the Taproom or Café.",
    rightImage: '/lovable-uploads/4ea420c5-ba71-4d78-abba-9966d51143f0.png'
  },
  { 
    type: 'HERO', 
    title: 'THE HALL', 
    subtitle: '', 
    backgroundImage: '/lovable-uploads/f409d2c8-b310-4231-9843-31ae8cf0ecd5.png' 
  },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/e8f27397-9658-4342-b75c-8bff91090e67.png', alt: 'Industrial hall interior with brick walls and metal ceiling structure' },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/14947106-1082-495d-a320-e9b9f52e1379.png', alt: 'Modern industrial corridor with glass doors and natural lighting' },
  { 
    type: 'IMAGE_TEXT', 
    title: 'THE HALL. EVENT SPACE.',
    rightTitle: 'THE HALL',
    leftContent: "The Hall at Croft Common is our largest and most versatile space — a venue full of character, set within a building that blends industrial heritage with contemporary style. With its raw energy, original features and endless potential, The Hall offers a unique backdrop for one-of-a-kind events that leave a lasting impression.\n\nThis is a space designed to adapt — from wedding celebrations and corporate parties to special exhibitions. It's vast, flexible, and can be transformed with elegance and imagination to match the client's vision.\n\nWhether hired on its own or combined with the adjoining Terrace and Rooftop, The Hall offers possibilities that go far beyond a traditional venue. Our dedicated events team works with every client to help shape, plan, and deliver the perfect experience — whatever the occasion.\n\nWe aim to host at least 25 weddings a year, offering couples a stylish 'urban' alternative to the country estate. With hotels at every price point just a short walk away, Croft Common gives couples and planners the chance to create a wedding weekend that's flexible, fun, and seamless — from relaxed night-before drinks to a day-after gathering across our ground-floor spaces.\n\nThe Hall and Rooftop can stay open until 1:30am, giving events the freedom to flow into the night. The Hall's capacity is 400 standing, with seated events comfortably accommodating up to 220 guests.",
    rightImage: "/lovable-uploads/a0ae3c58-ca38-458c-9be0-d6860f7af235.png"
  },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/dc853637-3a6a-4e1d-a921-f4fc1be81134.png', alt: 'Wedding venue setup with industrial brick walls and elegant dining arrangements' },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/630eaa28-f2e7-41c3-b576-0794724b5d34.png', alt: 'Event space with chandeliers and autumn-themed table settings in industrial venue' },
  { type: 'HERO', title: 'THE HALL TERRACE', subtitle: '', backgroundImage: '/lovable-uploads/4ea420c5-ba71-4d78-abba-9966d51143f0.png' },
  { type: 'HERO', title: 'THE ROOFTOP', backgroundImage: '/lovable-uploads/91371b23-d165-4e7b-8661-82d2c7508cde.png', noOverlay: true },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/eea25fb0-c01f-4026-91c4-4578a1cfcc7d.png', alt: 'Rooftop terrace with modern pergola and city views' },
  { 
    type: 'IMAGE_TEXT', 
    title: 'THE ROOFTOP. BRISTOL\'S ONLY TRUE ROOFTOP BAR.',
    rightTitle: 'THE ROOFTOP',
    leftContent: "The Rooftop is Bristol's only true rooftop bar and events pavilion. Sitting atop the building, it captures the city lights and the vibrant energy of Stokes Croft below.\n\nFilled with greenery, trees and soft lighting, the look and feel of this space evolves with the seasons, creating the right mood for every moment. In summer, it's all about Aperol spritz, crisp beers and cocktails under open skies. In the winter, the terrace transforms into a cosy hideaway with heaters, blankets and sheltered corners, perfect for warming up with mulled wine or hot cocktails as the city lights glow below.\n\nThe Rooftop has the potential to become Bristol favourite roof garden to enjoy long summer evenings and cosy winter nights.\n\nLike The Hall Terrace, the space can be split — part private, part open to the public — offering flexibility for any event.\n\nThe Roof Terrace, along with The Hall can open until 1.30 am. As a standalone venue it can comfortably occupy 120 people standing and lounging.",
    rightImage: "/lovable-uploads/11fd165f-dc22-41dc-80f5-8c38cc022923.png"
  },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/0cad0be9-a1f3-4a81-abc6-042496911628.png', alt: 'Casual dining serious craft window signage' },
  { type: 'PLAIN_IMAGE', backgroundImage: '/lovable-uploads/21b8d579-c2a1-47be-8892-9e87e4dfa27c.png', alt: 'Croft Common exterior at night with illuminated rooftop' },
  { type: 'QUESTIONNAIRE' }
];

// Sample data for three column slides
const sampleColumns: [
  { title: string; content: string; icon: React.ReactNode },
  { title: string; content: string; icon: React.ReactNode },
  { title: string; content: string; icon: React.ReactNode }
] = [
  { title: 'Feature One', content: 'Description for the first feature or benefit.', icon: <Crown className="h-12 w-12" /> },
  { title: 'Feature Two', content: 'Description for the second feature or benefit.', icon: <Zap className="h-12 w-12" /> },
  { title: 'Feature Three', content: 'Description for the third feature or benefit.', icon: <Award className="h-12 w-12" /> }
];

// Sample data for gallery slides
const sampleGalleryItems = [
  { title: 'Gallery Item 1', description: 'Description for first gallery item' },
  { title: 'Gallery Item 2', description: 'Description for second gallery item' },
  { title: 'Gallery Item 3', description: 'Description for third gallery item' },
  { title: 'Gallery Item 4', description: 'Description for fourth gallery item' }
];

const SecretKitchensContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isGlobalMuted, toggleGlobalMute } = useAudio();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [isSignup, setIsSignup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Check if user's email is in secret_kitchen_access table
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [accessExpired, setAccessExpired] = useState(false);

  useEffect(() => {
    if (user?.email) {
      checkUserAccessStatus(user.email);
    }
  }, [user]);

  const checkEmailAccess = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('secret_kitchen_access')
        .select('email')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking email access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking email access:', error);
      return false;
    }
  };

  const checkUserAccessStatus = async (email: string) => {
    try {
      const { data, error } = await supabase
        .rpc('check_secret_kitchen_access_status', { user_email: email.toLowerCase() });

      if (error) {
        console.error('Error checking access status:', error);
        return;
      }

      if (data && data.length > 0) {
        const status = data[0];
        if (!status.has_access) {
          setIsAuthorized(false);
          return;
        }
        
        if (status.is_expired) {
          setAccessExpired(true);
          setIsAuthorized(false);
          logout();
          return;
        }

        if (status.access_expires_at) {
          setAccessExpiresAt(status.access_expires_at);
        }
      }
    } catch (error) {
      console.error('Error checking access status:', error);
    }
  };

  const sendOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setIsSignup(activeTab === 'signup');
    
    try {
      // First check if email has access
      const hasAccess = await checkEmailAccess(email);
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "This email is not authorized for Secret Kitchen access.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Use Supabase's native OTP system (6-digit code)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          shouldCreateUser: activeTab === 'signup',
          data: activeTab === 'signup' ? {
            user_type: 'secret_kitchens'
          } : undefined
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        if (error.message?.includes('Signup not allowed')) {
          toast({
            title: "Account Creation Failed",
            description: "Account creation failed. Please contact support.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to send verification code.",
            variant: "destructive"
          });
        }
      } else {
        setOtpSent(true);
        const action = activeTab === 'signup' ? 'Account creation code' : 'Verification code';
        toast({
          title: `${action} Sent`,
          description: "Check your email for a 6-digit verification code."
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase(),
        token: otpCode,
        type: 'email'
      });

      if (error) {
        console.error('OTP verify error:', error);
        toast({
          title: "Invalid Code",
          description: "Invalid or expired verification code.",
          variant: "destructive"
        });
      } else if (data?.user) {
        // Refresh the session to ensure we have the latest auth state
        await supabase.auth.refreshSession();
        
        // Update first access and get expiration time
        try {
          const { data: accessData, error: accessError } = await supabase
            .rpc('update_secret_kitchen_first_access', { user_email: email.toLowerCase() });

          if (accessError) {
            console.error('Error updating first access:', accessError);
          } else if (accessData && accessData.length > 0) {
            setAccessExpiresAt(accessData[0].access_expires_at);
          }
        } catch (error) {
          console.error('Error updating first access:', error);
        }

        setIsAuthorized(true);
        const action = isSignup ? 'Account created!' : 'Welcome back!';
        toast({
          title: "Authentication Successful",
          description: `${action} Accessing Secret Kitchens...`
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setOtpCode('');
    setOtpSent(false);
    setIsAuthorized(false);
    setAccessExpiresAt(null);
    setAccessExpired(false);
    if (!accessExpired) {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
    }
  };

  const handleAccessExpired = () => {
    setAccessExpired(true);
    setIsAuthorized(false);
    logout();
    toast({
      title: "Access Expired",
      description: "Your 48-hour access has expired. Please contact support if you need extended access.",
      variant: "destructive"
    });
  };

  useEffect(() => {
    if (!api) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        api.scrollPrev();
      } else if (event.key === 'ArrowRight') {
        api.scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api]);

  // Sync carousel state with currentSlide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    const onScrollPrev = () => {
      setCanScrollPrev(api.canScrollPrev());
    };

    const onScrollNext = () => {
      setCanScrollNext(api.canScrollNext());
    };

    api.on('select', onSelect);
    api.on('reInit', onSelect);
    api.on('reInit', onScrollPrev);
    api.on('reInit', onScrollNext);

    // Set initial state
    setCurrentSlide(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, [api]);

  const renderSlide = (config: any) => {
    switch (config.type) {
      case 'LANDING':
        return (
          <LandingSlide
            onEnter={() => {
              api?.scrollTo(1);
              setCurrentSlide(1);
            }}
          />
        );
      case 'HERO':
        return (
          <HeroSlide
            title={config.title}
            subtitle={config.subtitle}
            backgroundImage={config.backgroundImage}
            noOverlay={config.noOverlay}
          />
        );
      
      case 'CENTERED':
        return (
          <CenteredSlide
            title={config.title}
            subtitle={config.subtitle}
            leftContent={config.leftContent}
            rightContent={config.rightContent}
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'THREE_COLUMN':
        return (
          <ThreeColumnSlide
            title={config.title}
            subtitle={config.subtitle}
            columns={sampleColumns}
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'GALLERY':
        return (
          <GallerySlide
            title={config.title}
            subtitle={config.subtitle}
            items={sampleGalleryItems.slice(0, config.columns || 3)}
            backgroundColor={config.backgroundColor}
            columns={config.columns || 3}
          />
        );
      
      case 'SPLIT_LAYOUT':
      case 'SPLIT':
        return (
          <SplitLayoutSlide
            title={config.title}
            rightTitle={config.rightTitle}
            leftContent={config.leftContent}
            rightContent={config.rightContent}
            rightImage={config.rightImage}
          />
        );
      
      case 'TAPROOM':
        return (
          <TaproomSlide
            title={config.title}
            leftContent={config.leftContent}
            rightImage={config.rightImage}
          />
        );
      
      case 'SPLIT_LAYOUT_WITH_TITLE':
        return (
          <SplitLayoutWithTitleSlide
            title={config.title}
            leftContent={config.leftContent}
            rightImage={config.rightImage}
          />
        );
      
      case 'COURTYARD':
        return (
          <CourtyardSlide
            title={config.title}
            rightTitle={config.rightTitle}
            leftContent={config.leftContent}
            rightImage={config.rightImage}
          />
        );
      
      case 'HALF_SCREEN':
        return (
          <HalfScreenSlide
            content={config.content}
            backgroundImage={config.backgroundImage}
            imagePosition="left"
          />
        );
      
      case 'LIST':
        return (
          <ListSlide
            items={config.items}
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'IMAGE_TEXT':
        return (
          <ImageTextSlide
            title={config.title}
            rightTitle={config.rightTitle}
            leftContent={config.leftContent}
            rightImage={config.rightImage}
          />
        );
      
      case 'PLAIN_IMAGE':
        return (
          <PlainImageSlide
            backgroundImage={config.backgroundImage}
            alt={config.alt}
          />
        );
      
      case 'QUESTIONNAIRE':
        return <QuestionnaireSlide />;
      
      default:
        return (
          <CenteredSlide
            title="Unknown Layout"
            subtitle="Template Error"
            content="This slide type is not recognized."
          />
        );
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if user is not authenticated or not authorized
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[hsl(var(--accent-pink))] flex items-center justify-center p-4 relative">
        {/* Croft Common branding with logo */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
          <CroftLogo size="lg" className="text-white" />
          <h1 className="text-white text-2xl font-brutalist tracking-wider">CROFT COMMON</h1>
        </div>

        <div className="w-full flex flex-col items-center space-y-6">
          {/* Instruction text box - wider */}
          <div className="w-full max-w-2xl bg-[hsl(var(--accent-pink))] border-2 border-white rounded-lg p-6 text-white">
            <div className="space-y-4 text-center">
              <p className="text-lg leading-relaxed">Welcome. You're one of the few invited behind the curtain at Croft Common.</p>
              <p className="text-lg leading-relaxed">This page won't last. From the moment you enter, the clock is ticking - 48 hours before it disappears.</p>
              <p className="text-lg font-brutalist tracking-wider">— Croft Common</p>
            </div>
          </div>

          {/* Authentication form - smaller width */}
          <div className="w-full max-w-md">
            {otpSent ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white">Enter verification code</CardTitle>
                  <CardDescription className="text-white/80">
                    We've sent a 6-digit code to {email}. Enter it below to access Secret Kitchens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={verifyOtpCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-white">Verification code</Label>
                      <InputOTP
                        value={otpCode}
                        onChange={setOtpCode}
                        maxLength={6}
                        disabled={loading}
                        className="justify-center"
                      >
                        <InputOTPGroup className="bg-white/20 border-white/30 text-white">
                          <InputOTPSlot index={0} className="bg-white/20 border-white/30 text-white" />
                          <InputOTPSlot index={1} className="bg-white/20 border-white/30 text-white" />
                          <InputOTPSlot index={2} className="bg-white/20 border-white/30 text-white" />
                          <InputOTPSlot index={3} className="bg-white/20 border-white/30 text-white" />
                          <InputOTPSlot index={4} className="bg-white/20 border-white/30 text-white" />
                          <InputOTPSlot index={5} className="bg-white/20 border-white/30 text-white" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        type="submit"
                        disabled={loading || otpCode.length !== 6}
                        className="w-full bg-white text-[hsl(var(--accent-pink))] hover:bg-white/90"
                      >
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                        }}
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10"
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white">Secret Kitchens</CardTitle>
                  <CardDescription className="text-white/80 space-y-2">
                    <p className="text-sm font-medium text-white/90">
                      <strong>First time?</strong> Use Sign Up to create your user, and then Sign-In to access
                    </p>
                    <p className="text-sm text-white/70">
                      <strong>Back again?</strong> Sign-In with a six-digit code to access the Croft Common info.
                    </p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--accent-pink))]">Sign Up</TabsTrigger>
                      <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--accent-pink))]">Sign In</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="signup" className="space-y-4 mt-4">
                      <div className="text-sm text-white/80 bg-white/10 p-3 rounded border border-white/20">
                        Sign-up to create your user, we'll send you a 6-digit code to verify your email.
                      </div>
                      <form onSubmit={sendOtpCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-white">Email address</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your.name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-white text-[hsl(var(--accent-pink))] hover:bg-white/90">
                          {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signin" className="space-y-4 mt-4">
                      <div className="text-sm text-white/80 bg-white/10 p-3 rounded border border-white/20">
                        <strong>Already have an account?</strong> Sign in with your email address. We'll send you a 6-digit code to verify it's you.
                      </div>
                      <form onSubmit={sendOtpCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-white">Email address</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your.name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-white text-[hsl(var(--accent-pink))] hover:bg-white/90">
                          {loading ? 'Sending code...' : 'Send Code'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
      </div>
    );
  }

  // Show slide presentation for authenticated and authorized users
  return (
    <div className="min-h-screen bg-background">
      {/* Countdown Timer */}
      {accessExpiresAt && (
        <SecretKitchensCountdown 
          expiresAt={accessExpiresAt}
          onExpired={handleAccessExpired}
        />
      )}
      
      {/* Top controls - logout and master audio */}
      {!isMobile && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
          <Button 
            onClick={logout}
            variant="outline" 
            size="sm" 
            className={cn(
              "bg-background/95 backdrop-blur-sm border-2 border-foreground/20",
              "hover:bg-[hsl(var(--accent-pink))] hover:border-[hsl(var(--accent-pink))]",
              "hover:text-background transition-all duration-300",
              "font-brutalist tracking-wider text-xs"
            )}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <MasterAudioControl />
        </div>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigationMenu
          slideLabels={slideNavigationLabels}
          currentSlide={currentSlide}
          onSlideSelect={(index) => {
            api?.scrollTo(index);
            setCurrentSlide(index);
          }}
          onLogout={logout}
          isMuted={isGlobalMuted}
          onToggleMute={toggleGlobalMute}
        />
      )}

      <Carousel
        setApi={setApi}
        className="w-full h-screen"
        opts={{
          align: "start",
          loop: true,
          slidesToScroll: 1,
        }}
      >
        <CarouselContent className="h-screen">
          {slideConfigs.map((config, index) => (
            <CarouselItem key={index} className="h-screen">
              {renderSlide(config)}
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Desktop Navigation dropdown - moved to top right */}
        {!isMobile && (
          <div className="absolute top-4 right-20 z-20">
            <StyledNavigationDropdown
              currentSlide={currentSlide}
              labels={slideNavigationLabels}
              onSlideSelect={(index) => {
                api?.scrollTo(index);
                setCurrentSlide(index);
              }}
            />
          </div>
        )}

        {/* Desktop Slide counter */}
        {!isMobile && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentSlide + 1} / {slideConfigs.length}
            </div>
          </div>
        )}

        {/* Desktop Carousel Arrows */}
        {!isMobile && (
          <TransparentCarouselArrows
            onPrevious={() => {
              api?.scrollPrev();
              if (api) setCurrentSlide(api.selectedScrollSnap());
            }}
            onNext={() => {
              api?.scrollNext();
              if (api) setCurrentSlide(api.selectedScrollSnap());
            }}
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
          />
        )}

        {/* Mobile Carousel Controls */}
        {isMobile && (
          <MobileCarouselControls
            onPrevious={() => {
              api?.scrollPrev();
              if (api) setCurrentSlide(api.selectedScrollSnap());
            }}
            onNext={() => {
              api?.scrollNext();
              if (api) setCurrentSlide(api.selectedScrollSnap());
            }}
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
            currentSlide={currentSlide}
            totalSlides={slideConfigs.length}
          />
        )}
      </Carousel>
    </div>
  );
};

const SecretKitchens = () => {
  return (
    <AudioProvider>
      <SecretKitchensContent />
    </AudioProvider>
  );
};

export default SecretKitchens;