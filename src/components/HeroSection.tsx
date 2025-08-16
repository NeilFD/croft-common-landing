import HeroCarousel from './HeroCarousel';
import CMSText from './cms/CMSText';

const HeroSection = () => {
  return (
    <div className="relative">
      <HeroCarousel />
      {/* CMS-driven title overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
        <div className="text-center text-background drop-shadow-lg">
          <CMSText
            page="home"
            section="hero"
            content_key="title"
            fallback="CROFT COMMON"
            className="font-brutalist text-5xl md:text-7xl lg:text-8xl mb-4 tracking-wider"
            as="h1"
          />
          <CMSText
            page="home"
            section="hero"
            content_key="subtitle"
            fallback="PURE HOSPITALITY"
            className="font-industrial text-lg md:text-xl tracking-widest opacity-90"
            as="p"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;