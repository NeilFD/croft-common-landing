import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CommonRoom = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="flex-1 min-h-[calc(100vh-140px)] relative">
        {/* Watermark in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png" 
            alt="Croft watermark" 
            className="w-32 h-32 opacity-20 filter brightness-0"
          />
        </div>
      </main>
      
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-black hover:text-green-600 transition-colors duration-200">
            THE COMMON ROOM
          </h2>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CommonRoom;