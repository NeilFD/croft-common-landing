import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="min-h-screen bg-white relative flex flex-col items-center justify-start pt-48 pb-20">
        {/* Page Title back in original position */}
        <div className="absolute top-24 left-[106px] z-20">
          <h1 className="text-3xl font-light text-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-green-600 cursor-pointer">
            THE COMMON ROOM
          </h1>
        </div>
        
        {/* Watermark image moved up */}
        <div className="flex items-center justify-center mb-8">
          <img 
            src="/lovable-uploads/90a63358-50bd-4ab2-adeb-cf9350f4f4b2.png" 
            alt="Common Room Layout" 
            className="w-[40rem] h-[40rem] opacity-20 object-contain"
          />
        </div>
        
        {/* Sign in text moved down */}
        <h2 className="text-2xl font-light text-black tracking-[0.2em] uppercase">
          Sign in here
        </h2>
      </main>
      <Footer />
    </div>
  );
};

export default CommonRoom;