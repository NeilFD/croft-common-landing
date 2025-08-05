import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="min-h-screen bg-white relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png" 
            alt="Croft watermark" 
            className="w-[40rem] h-[40rem] opacity-20 filter brightness-0 object-contain"
          />
        </div>

        {/* Page Title Overlay */}
        <div className="absolute top-24 left-[106px] z-20">
          <h1 className="text-3xl font-light text-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-green-600 cursor-pointer">
            THE COMMON ROOM
          </h1>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommonRoom;