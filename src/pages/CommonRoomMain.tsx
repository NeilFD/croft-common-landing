import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommonRoomHeroCarousel from "@/components/CommonRoomHeroCarousel";

const CommonRoomMain = () => {
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
        <Navigation />
        <CommonRoomHeroCarousel />
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
              THE COMMON ROOM
            </h2>
            <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Quiet access. Shared space. Early invites. Inside track.
              <br /><br />
              A place to hear first, see first, know first.
              <br /><br />
              Members, not membership.
            </p>
          </div>
        </section>
        <Footer showSubscription={false} />
      </div>
    </div>
  );
};

export default CommonRoomMain;