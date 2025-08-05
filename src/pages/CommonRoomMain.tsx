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
        <Footer />
      </div>
    </div>
  );
};

export default CommonRoomMain;