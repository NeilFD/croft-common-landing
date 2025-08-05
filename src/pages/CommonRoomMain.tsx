import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommonRoomHeroCarousel from "@/components/CommonRoomHeroCarousel";

const CommonRoomMain = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CommonRoomHeroCarousel />
      <Footer />
    </div>
  );
};

export default CommonRoomMain;