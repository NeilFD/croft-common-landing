import { useState } from 'react';
import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';
import PongGame from './PongGame';

import { commonRoomHeroImages as fallbackCommonRoomImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import { commonRoomMenuData } from '@/data/menuData';
import CroftLogo from './CroftLogo';
import { useAuth } from '@/hooks/useAuth';

const CommonRoomHeroCarousel = () => {
  const [showPongGame, setShowPongGame] = useState(false);
  const { user } = useAuth();
  
  // Fetch CMS images with fallback to static images
  const { images: commonRoomImages, loading: imagesLoading } = useCMSImages(
    'common-room', 
    'common_room_hero', 
    { fallbackImages: fallbackCommonRoomImages }
  );

  // Check if user is a subscriber by checking if they're authenticated
  const canPlayGame = !!user;

  const handleLogoClick = () => {
    if (canPlayGame) {
      setShowPongGame(true);
    }
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Single Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${commonRoomImages[0]?.src}')`
        }}
      />

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <div 
          onClick={handleLogoClick}
          className={`group ${canPlayGame ? 'cursor-pointer' : 'cursor-default'}`}
          title={canPlayGame ? 'Click to play Pong!' : 'Sign in to play Pong'}
        >
          <CroftLogo
            className={`w-[22rem] h-[22rem] sm:w-[24rem] sm:h-[24rem] md:w-[26rem] md:h-[26rem] lg:w-[28rem] lg:h-[28rem] opacity-30 object-contain transition-all duration-500 invert ${
              canPlayGame ? 'hover:opacity-70 hover:scale-105' : 'opacity-20'
            }`}
          />
          {canPlayGame && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-sm">
                CLICK TO PLAY PONG
              </div>
            </div>
          )}
        </div>
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

      {/* Book Button */}
      <BookFloatingButton />

      {/* Menu Button */}
      <MenuButton pageType="common-room" menuData={commonRoomMenuData} forceCafeAccent />

      {/* Pong Game Modal */}
      {showPongGame && (
        <PongGame onClose={() => setShowPongGame(false)} />
      )}
    </div>
  );
};

export default CommonRoomHeroCarousel;