const Navigation = () => {
  const navItems = ['CAFE', 'COCKTAILS', 'BEER', 'KITCHENS', 'HALL'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="font-brutalist text-2xl text-foreground tracking-tight">
          CROFT COMMON
        </div>
        
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <button
              key={item}
              className="font-industrial text-sm tracking-wide text-foreground hover:text-accent-pink transition-colors duration-200"
            >
              {item}
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