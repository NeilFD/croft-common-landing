import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] relative">
        {/* Watermark in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png" 
            alt="Croft watermark" 
            className="w-32 h-32 opacity-20 filter brightness-0"
          />
        </div>
        
        {/* Title */}
        <h1 className="font-brutalist text-4xl md:text-6xl text-black z-10">
          THE COMMON ROOM
        </h1>
      </main>
      <Footer />
    </div>
  );
};

export default CommonRoom;