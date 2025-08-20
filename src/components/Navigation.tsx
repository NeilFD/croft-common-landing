import { useState } from 'react';
import { useTransition } from '@/contexts/TransitionContext';
import { preloadImages } from '@/hooks/useImagePreloader';
import { UserMenu } from './UserMenu';
import { MemberLoginModal } from './MemberLoginModal';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRoutePreview } from '@/data/routeHeroMap';
import { Button } from '@/components/ui/button';
import CroftLogo from '@/components/CroftLogo';
import { CMSText } from './cms/CMSText';
const Navigation = () => {
  const { triggerTransition } = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { name: 'CAFE', path: '/cafe' },
    { name: 'COCKTAILS', path: '/cocktails' },
    { name: 'BEER', path: '/beer' },
    { name: 'KITCHENS', path: '/kitchens' },
    { name: 'HALL', path: '/hall' },
    { name: 'COMMUNITY', path: '/community' },
    { name: 'THE COMMON ROOM', path: '/common-room' }
  ];

  // Preload images for better performance
  const pageImages = {
    '/cafe': [
      '/lovable-uploads/886e7962-c1ff-41e4-957d-143eb9c28760.png',
      '/lovable-uploads/a6fcbd2e-334d-49e3-9b5d-d7dd0e87d852.png',
      '/lovable-uploads/2fa67cb3-bc38-4512-9fbe-2fcfb70815ab.png'
    ],
    '/hall': [
      '/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png',
      '/lovable-uploads/8e6a7ddc-9c1d-4779-bd58-8c4ef5fd6646.png',
      '/lovable-uploads/662eb2b5-85e4-444a-a911-30028613c638.png'
    ],
    '/cocktails': [
      '/lovable-uploads/e6f7674f-71d0-4ec4-8782-a283ed5ba5b5.png',
      '/lovable-uploads/13ac21e8-600e-49ed-9565-c01a222ada20.png',
      '/lovable-uploads/5d770f71-d0ac-45ef-b72f-b853c4020425.png'
    ],
    '/beer': [
      '/lovable-uploads/9bc2ce00-844e-4246-8ed9-16ca984f0af9.png',
      '/lovable-uploads/8ea5b295-7d10-4aeb-a64c-b646f4046ee2.png',
      '/lovable-uploads/b64216a3-dd09-4428-a328-02343a5f2a23.png'
    ],
    '/kitchens': [
      '/lovable-uploads/0a0894f9-a169-4747-9282-2150f198561c.png',
      '/lovable-uploads/1b15e13f-fb17-4f03-a1d9-9a7c2a2611b3.png',
      '/lovable-uploads/3f7371f7-30d1-4118-b421-5a4937be9a2d.png'
    ],
    '/community': [
      '/lovable-uploads/96977a94-65ef-4620-ae91-5440d335123f.png',
      '/lovable-uploads/dc15ca32-0829-46a6-9db5-897ebaafaff9.png',
      '/lovable-uploads/ada4b655-67e6-4bbe-8e52-ea2d407da312.png'
    ]
  };

  const handleNavHover = (path: string) => {
    const images = pageImages[path as keyof typeof pageImages];
    if (images) {
      preloadImages(images);
    }
  };

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu
    if (path === '/') {
      // Only play strobe transition when going home
      triggerTransition('/');
    } else {
      // Soft transition for section navigations
      const preview = getRoutePreview(path);
      if (preview) {
        triggerTransition(path, { variant: 'soft', previewSrc: preview });
      } else {
        navigate(path);
      }
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getNavItemColor = (itemName: string) => {
    if (itemName === 'COCKTAILS') return 'hover:text-[hsl(var(--accent-lime))]';
    if (itemName === 'BEER') return 'hover:text-accent-orange';
    if (itemName === 'KITCHENS') return 'hover:text-accent-blood-red';
    if (itemName === 'HALL') return 'hover:opacity-80';
    if (itemName === 'COMMUNITY') return 'hover:text-[hsl(var(--accent-electric-blue))]';
    if (itemName === 'THE COMMON ROOM') return 'hover:text-green-600';
    return 'hover:text-accent-pink';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-1 sm:px-2 md:px-6 py-4 flex justify-between items-center">
        <button 
          onClick={() => handleNavClick('/')}
          className="flex items-center space-x-4 hover:scale-105 transition-transform duration-200"
        >
          <CroftLogo 
            size="lg"
            className="w-[4.5rem] h-[4.5rem] md:translate-x-2"
            priority={true}
          />
          <CMSText
            page="global"
            section="navigation"
            contentKey="brand_name"
            fallback="CROFT COMMON"
            className="font-brutalist text-xl md:text-2xl text-foreground tracking-tight whitespace-nowrap"
            as="div"
          />
        </button>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.name}
                variant="frameNeutral"
                shape="pill"
                size="sm"
                onClick={() => handleNavClick(item.path)}
                onMouseEnter={() => handleNavHover(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`h-8 px-3 text-xs font-industrial tracking-wide text-[hsl(var(--charcoal))] transition-all duration-200 hover:scale-105 hover:bg-transparent focus:bg-transparent active:bg-transparent hover:border-[hsl(var(--accent-pink))] active:border-[hsl(var(--accent-pink))] focus:border-[hsl(var(--accent-pink))] ${isActive ? 'border-[hsl(var(--accent-pink))]' : ''}`}
              >
                {item.name}
              </Button>
            );
          })}


          <UserMenu />
        </div>
        
        {/* Mobile Navigation - Show UserMenu */}
        <div className="md:hidden">
          <UserMenu />
        </div>
        
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden font-industrial text-sm text-foreground p-2 hover:scale-105 transition-transform duration-200 ml-2"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className={`md:hidden bg-background/95 backdrop-blur-sm border-b border-charcoal transition-all duration-300 ease-in-out ${
        isMobileMenuOpen 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="px-4 py-4 space-y-4 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.name}
                variant="frameNeutral"
                shape="square"
                size="sm"
                onClick={() => handleNavClick(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative block w-fit text-left self-start font-industrial tracking-tight text-[hsl(var(--charcoal))] transition-all duration-200 hover:scale-105 py-2 pl-2 pr-8 hover:bg-transparent focus:bg-transparent active:bg-transparent hover:border-[hsl(var(--accent-pink))] active:border-[hsl(var(--accent-pink))] focus:border-[hsl(var(--accent-pink))] ${isActive ? 'border-[hsl(var(--accent-pink))]' : ''}`}
              >
                <span className="whitespace-nowrap">{item.name}</span>
                <ArrowUpRight className="size-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </Button>
            );
          })}

        </div>
      </div>
      
      <MemberLoginModal />
    </nav>
  );
};

export default Navigation;