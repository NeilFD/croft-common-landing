import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';
import { commonRoomHeroImages } from '@/data/heroImages';
import { commonRoomMenuData } from '@/data/menuData';


const CommonRoomHeroCarousel = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Single Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${commonRoomHeroImages[0].src}')`
        }}
      />

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
          alt="Common Room Watermark"
          className="w-[20rem] h-[20rem] sm:w-[22rem] sm:h-[22rem] md:w-[24rem] md:h-[24rem] lg:w-[26rem] lg:h-[26rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Card Overlay */}
      <div className="absolute top-24 left-[106px] z-20">
        <div className="bg-background/90 rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-2xl font-light text-foreground tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            THE COMMON ROOM
          </h1>
          <h2 className="text-lg font-light text-foreground tracking-[0.1em] uppercase mt-1 transition-all duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            PURE HOSPITALITY
          </h2>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-[hsl(var(--accent-pink))]"></div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-[hsl(var(--accent-pink))] mt-1"></div>
        </div>
      </div>

      {/* Book Button */}
      <BookFloatingButton />

      {/* Menu Button */}
      <MenuButton pageType="common-room" menuData={commonRoomMenuData} forceCafeAccent />
    </div>
  );
};

export default CommonRoomHeroCarousel;