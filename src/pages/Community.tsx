import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommunityHeroCarousel from "@/components/CommunityHeroCarousel";
import { useEffect } from 'react';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

const Community = () => {
  const { isCMSMode } = useCMSMode();

  useEffect(() => {
    document.title = 'Community | Crazy Bear';
  }, []);

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <CommunityHeroCarousel />
      <section className="pb-24 bg-background" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="community" 
            section="hero" 
            contentKey="title" 
            fallback="COMMON GROUND"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="community" 
            section="hero" 
            contentKey="description" 
            fallback="We didn't land here by accident.\n\nCrazy Bear was built in the heart of it all - the murals, the music, the noise, it has roots.\n\nStokes Croft isn't a backdrop, it's part of the fabric. We're here for more than trade. We give back in time, space, and support.\n\nAlways add, never subtract."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>


      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Community;