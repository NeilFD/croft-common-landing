import { useState } from 'react';
import { useTransition } from '@/contexts/TransitionContext';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const { triggerTransition } = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'CAFE', path: '/cafe' },
    { name: 'COCKTAILS', path: '/cocktails' },
    { name: 'BEER', path: '/beer' },
    { name: 'KITCHENS', path: '/kitchens' },
    { name: 'HALL', path: '/hall' },
    { name: 'COMMUNITY', path: '/community' }
  ];

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu
    triggerTransition(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getNavItemColor = (itemName: string) => {
    if (itemName === 'COCKTAILS') return 'hover:text-[hsl(var(--accent-lime))]';
    if (itemName === 'BEER') return 'hover:text-accent-orange';
    if (itemName === 'KITCHENS') return 'hover:text-accent-blood-red';
    if (itemName === 'HALL') return 'hover:text-accent-vivid-purple';
    if (itemName === 'COMMUNITY') return 'hover:text-[hsl(var(--accent-electric-blue))]';
    return 'hover:text-accent-pink';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button 
          onClick={() => handleNavClick('/')}
          className="flex items-center space-x-4 hover:scale-105 transition-transform duration-200"
        >
          <img 
            src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
            alt="Croft Common" 
            className="w-16 h-16"
          />
          <div className="font-brutalist text-2xl text-foreground tracking-tight">
            CROFT COMMON
          </div>
        </button>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              className={`font-industrial text-sm tracking-wide text-foreground transition-all duration-200 hover:scale-105 active:scale-110 ${getNavItemColor(item.name)}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden font-industrial text-sm text-foreground p-2 hover:scale-105 transition-transform duration-200"
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
        <div className="container mx-auto px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              className={`block w-full text-left font-industrial text-lg tracking-wide text-foreground transition-all duration-200 hover:scale-105 py-2 ${getNavItemColor(item.name)}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;