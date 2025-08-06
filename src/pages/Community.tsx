import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommunityHeroCarousel from "@/components/CommunityHeroCarousel";

const Community = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CommunityHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            COMMON GROUND
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            We didn't land here by accident.
            <br /><br />
            Croft Common was built in the middle of it - the murals, the music, the noise, the roots.
            <br /><br />
            Stokes Croft isn't a backdrop, it's part of the fabric. So we listen. We show up. We give time, space, care. We pay it forward.
            <br /><br />
            Always add, never subtract.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Community;