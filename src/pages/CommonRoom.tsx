import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="h-[80vh] bg-white relative flex flex-col items-center justify-start pt-32 pb-20">
        {/* Page Title back in original position */}
        <div className="absolute top-24 left-[106px] z-20">
          <h1 className="text-3xl font-light text-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-green-600 cursor-pointer">
            THE COMMON ROOM
          </h1>
        </div>
        
        {/* Sign in text above watermark */}
        <h2 className="text-2xl font-light text-black tracking-[0.2em] uppercase mb-8 mt-8">
          Sign in here
        </h2>
        
        {/* Watermark image */}
        <div className="flex items-center justify-center flex-1 max-h-80">
          <img 
            src="/lovable-uploads/90a63358-50bd-4ab2-adeb-cf9350f4f4b2.png" 
            alt="Common Room Layout" 
            className="w-80 h-80 opacity-20 object-contain"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommonRoom;