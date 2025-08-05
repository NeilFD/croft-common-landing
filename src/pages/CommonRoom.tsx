import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero area with watermark */}
      <main className="min-h-screen bg-white relative flex flex-col items-center justify-center pt-32">
        {/* Page Title */}
        <h1 className="text-3xl font-light text-black tracking-[0.2em] uppercase mb-8">
          THE COMMON ROOM
        </h1>
        
        {/* Sign in text */}
        <h2 className="text-2xl font-light text-black tracking-[0.2em] uppercase mb-12">
          Sign in here
        </h2>
        
        <div className="flex items-center justify-center">
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