import { Link } from "react-router-dom";
import { CBSeo } from "@/components/seo/CBSeo";
import {
  organizationSchema,
  websiteSchema,
  hotelGroupSchema,
  hotelSchema,
  faqSchema,
  breadcrumbSchema,
} from "@/components/seo/CBStructuredData";
import { Suspense, lazy, useEffect, useState } from "react";
const heroPoster = "/video/crazy-bear-hero-poster.jpg";
const heroWebm = "/video/crazy-bear-hero.webm";
const heroMp4 = "/video/crazy-bear-hero.mp4";
const heroMp4Mobile = "/video/crazy-bear-hero-720.mp4";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBLandingSections from "@/components/crazybear/CBLandingSections";
import CBFooter from "@/components/crazybear/CBFooter";
import { PRIMARY_CTAS } from "@/data/cbSiteMap";

const HOMEPAGE_FAQS = [
  {
    question: "Where is The Crazy Bear?",
    answer:
      "Two hotels. Crazy Bear Country sits on Bear Lane, Stadhampton, Oxfordshire OX44 7UR. Crazy Bear Town is at 75 Wycombe End, Beaconsfield HP9 1LX.",
  },
  {
    question: "Can I book a room at The Crazy Bear?",
    answer:
      "Yes. Book direct for the best rate at either property. Country has signature country bedrooms in a 16th century inn. Town has townhouse-glamour rooms with a hidden pool.",
  },
  {
    question: "Do you host weddings at The Crazy Bear?",
    answer:
      "We do. Weddings, parties, birthdays and business events at Country in Stadhampton. Tell us what you have in mind and we will tailor the day.",
  },
  {
    question: "Where can I eat at The Crazy Bear?",
    answer:
      "Town has The Black Bear, B&B and Hom Thai, plus a cocktail bar. Country has the pub and pub food. All ours, all bookable.",
  },
  {
    question: "What is The Bear's Den?",
    answer:
      "Our members' room. Twenty-five percent off everywhere, in-app and in-venue, for £69 a month.",
  },
];

const Landing = () => {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <CBSeo
        title="HOTELS WITH A HISTORY | TOWN & COUNTRY | Crazy Bear"
        description="The Crazy Bear. Boutique hotels, restaurants and bars in Beaconsfield and Stadhampton. Rooms, dining, weddings and a members' room called The Bear's Den."
        path="/"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          hotelGroupSchema(),
          hotelSchema("country"),
          hotelSchema("town"),
          breadcrumbSchema("/"),
          faqSchema(HOMEPAGE_FAQS),
        ]}
      />

      <main className="bg-black text-white font-cb-sans">
        <section className="relative h-screen w-full overflow-hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroPoster}
            aria-hidden="true"
          >
            <source src={heroWebm} type="video/webm" />
            <source src={heroMp4Mobile} type="video/mp4" media="(max-width: 768px)" />
            <source src={heroMp4} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/75" />

          <CBTopNav tone="light" />

          {/* Centred mark / wordmark */}
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 transition-all duration-[1400ms] ease-out ${
              introDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h1 className="mt-7 font-display text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.85] tracking-tight">
              Crazy Bear
              <span className="sr-only">
                , HOTELS WITH A HISTORY | TOWN & COUNTRY
              </span>
            </h1>
            <p className="mt-7 font-cb-mono text-[10px] md:text-xs tracking-[0.55em] uppercase opacity-85">
              HOTELS WITH A HISTORY | TOWN & COUNTRY
            </p>
          </div>

          {/* Bottom entry chooser */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-[1400ms] delay-500 ease-out ${
              introDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/20 backdrop-blur-[1px]">
              <Link
                to="/town"
                className="group relative flex items-center justify-between px-7 md:px-12 py-7 md:py-9 hover:bg-white/[0.06] transition-colors"
              >
                <div>
                  <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
                    Beaconsfield
                  </p>
                  <p className="mt-2 font-display text-3xl md:text-5xl uppercase tracking-tight">
                    Town
                  </p>
                </div>
                <span className="font-cb-mono text-xs tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Enter &rarr;
                </span>
              </Link>
              <Link
                to="/country"
                className="group relative flex items-center justify-between px-7 md:px-12 py-7 md:py-9 border-t md:border-t-0 md:border-l border-white/20 hover:bg-white/[0.06] transition-colors"
              >
                <div>
                  <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
                    Stadhampton
                  </p>
                  <p className="mt-2 font-display text-3xl md:text-5xl uppercase tracking-tight">
                    Country
                  </p>
                </div>
                <span className="font-cb-mono text-xs tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Enter &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Editorial sections that mirror the global nav */}
        <CBLandingSections />

        {/* FAQ — visible on page; matches FAQPage JSON-LD above */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="border-t border-white/15 bg-black text-white px-6 md:px-12 py-20 md:py-28"
        >
          <div className="mx-auto max-w-4xl">
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
              Questions
            </p>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight"
            >
              Frequently asked
            </h2>
            <dl className="mt-10 space-y-8">
              {HOMEPAGE_FAQS.map((f) => (
                <div
                  key={f.question}
                  className="border-t border-white/15 pt-6"
                >
                  <dt className="font-cb-sans text-lg md:text-xl">
                    <h3 className="inline">{f.question}</h3>
                  </dt>
                  <dd className="mt-3 font-cb-sans text-base leading-relaxed opacity-80">
                    {f.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <CBFooter />
      </main>
    </>
  );
};

export default Landing;
