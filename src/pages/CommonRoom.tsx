import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="h-[90vh] md:h-[80vh] bg-white relative flex flex-col items-center justify-start pt-40 md:pt-32 pb-8 md:pb-20 px-4">
        {/* Page Title - responsive positioning */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 md:top-24 md:left-[106px] md:transform-none z-20">
          <h1 className="text-xl md:text-3xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all duration-300 hover:text-green-600 cursor-pointer text-center md:text-left">
            THE COMMON ROOM
          </h1>
        </div>
        
        {/* Sign in text - responsive spacing and sizing */}
        <h2 className="text-lg md:text-2xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase mb-8 md:mb-8 mt-20 md:mt-8">
          Sign in here
        </h2>
        
        {/* Watermark image - same size as other pages */}
        <div className="flex items-center justify-center flex-1 max-h-80">
          <img 
            src="/lovable-uploads/90a63358-50bd-4ab2-adeb-cf9350f4f4b2.png" 
            alt="Common Room Layout" 
            className="w-[40rem] h-[40rem] opacity-20 object-contain"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommonRoom;