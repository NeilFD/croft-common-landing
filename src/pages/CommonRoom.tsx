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
        <h2 className="text-lg md:text-2xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase mb-12 md:mb-16 mt-24 md:mt-16">
          Sign in here
        </h2>
        
        {/* Watermark image - positioned absolutely like other carousel pages */}
        <div className="absolute inset-0 flex items-center justify-center mt-16">
          <img 
            src="/src/assets/croft-logo.png" 
            alt="Common Room Layout" 
            className="w-[40rem] h-[40rem] opacity-20 object-contain"
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