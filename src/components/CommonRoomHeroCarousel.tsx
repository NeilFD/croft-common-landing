import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';
import NudgeFloatingButton from './NudgeFloatingButton';
import { commonRoomHeroImages } from '@/data/heroImages';
import { commonRoomMenuData } from '@/data/menuData';
import CroftLogo from './CroftLogo';

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
        <CroftLogo
          className="w-[22rem] h-[22rem] sm:w-[24rem] sm:h-[24rem] md:w-[26rem] md:h-[26rem] lg:w-[28rem] lg:h-[28rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 cursor-pointer invert"
        />
      </div>

      {/* Page Title Card Overlay */}
      <div className="absolute top-28 left-4 md:left-[106px] z-20">
        <div className="inline-block px-4 py-3 border-2 border-background bg-transparent rounded-lg transition-all duration-300 hover:border-[hsl(var(--accent-pink))]">
          <h1 className="text-2xl font-light text-background tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            THE COMMON ROOM
          </h1>
          <h2 className="text-lg font-light text-background tracking-[0.1em] uppercase mt-1 transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            PURE HOSPITALITY
          </h2>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-[hsl(var(--accent-pink))]"></div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[hsl(var(--accent-pink))] mt-1"></div>
        </div>
      </div>

      {/* Nudge Button (shown when notification clicked) */}
      <NudgeFloatingButton />
      
      {/* Book Button */}
      <BookFloatingButton />

      {/* Menu Button */}
      <MenuButton pageType="common-room" menuData={commonRoomMenuData} forceCafeAccent />
    </div>
  );
};

export default CommonRoomHeroCarousel;