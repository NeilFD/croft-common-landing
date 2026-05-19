import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import KaraokeHero from "@/components/karaoke/KaraokeHero";
import MarqueeTicker from "@/components/karaoke/MarqueeTicker";
import RoomSection from "@/components/karaoke/RoomSection";
import NeonManifesto from "@/components/karaoke/NeonManifesto";
import BackBar from "@/components/karaoke/BackBar";
import BookingPanel from "@/components/karaoke/BookingPanel";
import HouseRules from "@/components/karaoke/HouseRules";
import ClosingCTA from "@/components/karaoke/ClosingCTA";

const KaraokeHome = () => {
  const ld = [breadcrumbSchema("/town/karaoke")];

  return (
    <>
      <CBSeo
        title="Karaoke | Crazy Bear Town"
        description="Two-hour private karaoke booths at Crazy Bear Town. Noon till eight. Bring your worst, no encores refused."
        path="/town/karaoke"
        jsonLd={ld}
      />
      <KaraokeHero />
      <MarqueeTicker
        items={[
          "Tonight",
          "Two-hour slots",
          "Noon till eight",
          "Bring your worst",
          "No encores refused",
          "Crazy Bear Town",
        ]}
      />
      <RoomSection />
      <NeonManifesto />
      <BackBar />
      <BookingPanel />
      <HouseRules />
      <ClosingCTA />
    </>
  );
};

export default KaraokeHome;
