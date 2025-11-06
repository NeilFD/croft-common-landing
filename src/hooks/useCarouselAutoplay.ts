import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { useNativePlatform } from './useNativePlatform';
import { useIsMobile } from './use-mobile';

export const useCarouselAutoplay = (customDelay?: number) => {
  const { isIOS } = useNativePlatform();
  const isMobile = useIsMobile();
  
  const shouldAutoplay = !isIOS;
  const autoplayDelay = customDelay || (isMobile ? 6000 : 4000);
  
  const autoplay = useRef(
    shouldAutoplay 
      ? Autoplay({ 
          delay: autoplayDelay, 
          stopOnInteraction: false 
        }) 
      : null
  );
  
  return { autoplay, shouldAutoplay };
};
