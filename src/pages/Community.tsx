import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommunityHeroCarousel from "@/components/CommunityHeroCarousel";

const Community = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CommunityHeroCarousel />
      <Footer />
    </div>
  );
};

export default Community;