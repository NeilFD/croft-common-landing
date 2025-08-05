import MenuButton from './MenuButton';
import { commonRoomMenuData } from '@/data/menuData';

const CommonRoomHeroCarousel = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Single Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/322fb5be-0402-4d55-8a72-b5e9c3253eef.png')`
        }}
      />

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src="/lovable-uploads/90a63358-50bd-4ab2-adeb-cf9350f4f4b2.png" 
          alt="Common Room Watermark" 
          className="w-[40rem] h-[40rem] opacity-60 object-contain transition-all duration-500 hover:opacity-80 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Card Overlay */}
      <div className="absolute top-24 left-[106px] z-20">
        <div className="bg-background/90 rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-2xl font-light text-foreground tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-electric-blue))] cursor-pointer">
            THE COMMON ROOM
          </h1>
          <h2 className="text-lg font-light text-foreground tracking-[0.1em] uppercase mt-1 transition-all duration-300 hover:text-[hsl(var(--accent-electric-blue))] cursor-pointer">
            PURE HOSPITALITY
          </h2>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-px h-16 bg-background/50"></div>
      </div>

      {/* Menu Button */}
      <MenuButton pageType="community" menuData={commonRoomMenuData} />
    </div>
  );
};

export default CommonRoomHeroCarousel;