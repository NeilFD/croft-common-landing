import { useTransition } from '@/contexts/TransitionContext';

const Navigation = () => {
  const { triggerTransition } = useTransition();
  
  const navItems = [
    { name: 'CAFE', path: '/cafe' },
    { name: 'COCKTAILS', path: '/cocktails' },
    { name: 'BEER', path: '/beer' },
    { name: 'KITCHENS', path: '/kitchens' },
    { name: 'HALL', path: '/hall' }
  ];

  const handleNavClick = (path: string) => {
    triggerTransition(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
            alt="Croft Common" 
            className="w-16 h-16"
          />
          <div className="font-brutalist text-2xl text-foreground tracking-tight">
            CROFT COMMON
          </div>
        </div>
        
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              className={`font-industrial text-sm tracking-wide text-foreground transition-all duration-200 hover:scale-105 active:scale-110 ${
                item.name === 'COCKTAILS' 
                  ? 'hover:text-[hsl(var(--accent-lime))]' 
                  : item.name === 'BEER'
                  ? 'hover:text-accent-orange'
                  : 'hover:text-accent-pink'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        
        {/* Mobile menu button */}
        <button className="md:hidden font-industrial text-sm text-foreground">
          MENU
        </button>
      </div>
      
    </nav>
  );
};

export default Navigation;