import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-exterior.jpg";
import bearMark from "@/assets/crazy-bear-mark.png";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBSubscriptionForm from "@/components/crazybear/CBSubscriptionForm";


const Landing = () => {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Helmet>
        <title>The Crazy Bear | Country & Town</title>
        <meta
          name="description"
          content="The Crazy Bear. Two hotels, one spirit. Country in Stadhampton, Town in Beaconsfield."
        />
      </Helmet>

      <main className="bg-black text-white font-cb-sans">
        <section className="relative h-screen w-full overflow-hidden">
          <img
            src={heroImage}
            alt="The Crazy Bear"
            className="absolute inset-0 h-full w-full object-cover animate-[kenburns_22s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/75" />

          <CBTopNav tone="light" />

          {/* Centred mark / wordmark */}
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 transition-all duration-[1400ms] ease-out ${
              introDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <img
              src={bearMark}
              alt=""
              className="h-20 md:h-28 w-auto invert opacity-95"
            />
            <h1 className="mt-7 font-display text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.85] tracking-tight">
              Crazy Bear
            </h1>
            <p className="mt-7 font-cb-mono text-[10px] md:text-xs tracking-[0.55em] uppercase opacity-85">
              Town &nbsp; / &nbsp; Country
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

        <section className="border-t border-white/15 bg-black px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <CBSubscriptionForm />
          </div>
        </section>
      </main>


      <style>{`
        @keyframes kenburns {
          0%   { transform: scale(1)    translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </>
  );
};

export default Landing;
