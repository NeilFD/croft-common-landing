import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommonRoomHeroCarousel from "@/components/CommonRoomHeroCarousel";
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

const CommonRoomMain = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen relative">
      {/* Fixed background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/8f95beef-0163-4ded-a6c4-8b0a8bac8b08.png')`
        }}
      />
      
      {/* Scrollable content */}
      <div className="relative z-10">
        {!isCMSMode && <Navigation />}
        <CommonRoomHeroCarousel />
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 text-center">
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="title"
              fallback="THE COMMON ROOM"
              as="h2"
              className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="description"
              fallback="Quiet access. Shared space. Early invites. Inside track."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-4"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="subtitle"
              fallback="A place to hear first, see first, know first."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-4"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="tagline"
              fallback="Members, not membership."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-8"
            />
            <div className="mt-8">
              <a 
                href="/common-room/member" 
                className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Member Login
              </a>
            </div>
          </div>
        </section>
        {!isCMSMode && <Footer showSubscription={false} />}
      </div>
    </div>
  );
};

export default CommonRoomMain;