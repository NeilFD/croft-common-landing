import town01 from "@/assets/cb-carousel-new/town-01.jpg";
import town02 from "@/assets/cb-carousel-new/town-02.jpg";
import town03 from "@/assets/cb-carousel-new/town-03.jpg";
import town04 from "@/assets/cb-carousel-new/town-04.jpg";
import town05 from "@/assets/cb-carousel-new/town-05.jpg";
import town06 from "@/assets/cb-carousel-new/town-06.jpg";

import country01 from "@/assets/cb-carousel-new/country-01.jpg";
import country02 from "@/assets/cb-carousel-new/country-02.jpg";
import country03 from "@/assets/cb-carousel-new/country-03.jpg";
import country04 from "@/assets/cb-carousel-new/country-04.jpg";
import country05 from "@/assets/cb-carousel-new/country-05.jpg";
import country06 from "@/assets/cb-carousel-new/country-06.jpg";

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export const townGallery: GalleryItem[] = [
  { src: town02, alt: "Teal suite with copper bath", caption: "Sexy. Soak. Repeat." },
  { src: town01, alt: "Blue glitter bedroom", caption: "Bedtime, but make it disco." },
  { src: town05, alt: "Chandelier lounge", caption: "Sit pretty. Stay late." },
  { src: town03, alt: "Dark gold bedroom", caption: "Gold standard. Lights low." },
  { src: town04, alt: "Cocktails by the fire", caption: "One for the fire. Two for you." },
  { src: town06, alt: "Thai plates", caption: "Hot. Fast. Fragrant." },
];

export const countryGallery: GalleryItem[] = [
  { src: country02, alt: "Barn beam suite", caption: "Old beams. New ideas." },
  { src: country04, alt: "Copper bath", caption: "Copper. Hot. Relax." },
  { src: country01, alt: "Red velvet room with copper bath", caption: "Red room. No rules." },
  { src: country03, alt: "Terrace firepit", caption: "Outside. On fire." },
  { src: country05, alt: "Thai food spread", caption: "Thailand via Stadhampton." },
  { src: country06, alt: "Red bus reception", caption: "On the Bus. Welcome." },
];
