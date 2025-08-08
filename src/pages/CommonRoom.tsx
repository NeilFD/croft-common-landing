import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GestureOverlay from '@/components/GestureOverlay';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';


const CommonRoom = () => {
  const navigate = useNavigate();

  const handleGestureComplete = () => {
    navigate('/common-room/main');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="min-h-screen bg-white relative flex flex-col items-center justify-start pt-40 md:pt-32 px-4">
        {/* Page Title - responsive positioning */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 md:top-24 md:left-[106px] md:transform-none z-20">
          <h1 className="text-xl md:text-3xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-sage-green))] cursor-pointer text-center md:text-left">
            THE COMMON ROOM
          </h1>
        </div>
        
        {/* Sign in text - responsive spacing and sizing */}
        <h2 className="relative z-20 text-lg md:text-2xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase mb-24 md:mb-20 mt-32 md:mt-16">
          Sign in here
        </h2>
        
        {/* Watermark image - positioned absolutely like other carousel pages */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-start justify-center pt-72 md:pt-56">
          <img 
            src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
            alt="Common Room Layout"
            className="w-[20rem] h-[20rem] sm:w-[25rem] sm:h-[25rem] md:w-[30rem] md:h-[30rem] lg:w-[40rem] lg:h-[40rem] opacity-20 object-contain"
          />
        </div>
      </main>
      <Footer />
      <GestureOverlay onGestureComplete={handleGestureComplete} />
      <Toaster />
    </div>
  );
};

export default CommonRoom;