import { useEffect, useState } from "react";
import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import { CMSText } from "@/components/cms/CMSText";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/cb-landing-hero.jpg";

interface OfferCard {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_path: string | null;
}

const OffersLanding = () => {
  const [offers, setOffers] = useState<OfferCard[]>([]);

  useEffect(() => {
    // Pull from cms_content rows under page = 'offers-landing', section = 'card'.
    // Each row's content_data is expected to be { title, body, image_url, cta_label, cta_path }.
    (async () => {
      const { data } = await (supabase as any)
        .from("cms_content")
        .select("id, content_key, content_data")
        .eq("page", "offers-landing")
        .eq("section", "card")
        .eq("published", true)
        .order("content_key", { ascending: true });
      if (data) {
        setOffers(
          data
            .map((r: any) => ({
              id: r.id,
              title: r.content_data?.title ?? "",
              body: r.content_data?.body ?? null,
              image_url: r.content_data?.image_url ?? null,
              cta_label: r.content_data?.cta_label ?? null,
              cta_path: r.content_data?.cta_path ?? null,
            }))
            .filter((o: OfferCard) => o.title)
        );
      }
    })();
  }, []);

  return (
    <>
      <CBSeo
        title="Offers | Crazy Bear"
        description="Current offers at Crazy Bear Town & Country."
        canonical="https://crazybear.app/offers"
      />
      <CBTopNav tone="light" />
      <main className="bg-black text-white">
        {/* Hero */}
        <section className="relative min-h-[60vh] flex items-end overflow-hidden">
          <img
            src={heroImg}
            alt="Crazy Bear offers"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          <div className="relative z-10 px-6 md:px-12 pb-16 md:pb-24 pt-40 max-w-4xl">
            <CMSText
              as="p"
              page="offers-landing"
              section="hero"
              contentKey="eyebrow"
              fallback="Crazy Bear"
              className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-4"
            />
            <CMSText
              as="h1"
              page="offers-landing"
              section="hero"
              contentKey="title"
              fallback="Offers"
              className="font-display uppercase leading-[0.9] tracking-tight text-6xl md:text-8xl"
            />
            <CMSText
              as="p"
              page="offers-landing"
              section="hero"
              contentKey="body"
              fallback="Stay longer. Eat slower. Pay less."
              className="mt-6 font-cb-sans text-lg md:text-xl opacity-85"
            />
          </div>
        </section>

        {/* Offers grid */}
        <section className="px-6 md:px-12 py-20">
          {offers.length === 0 ? (
            <div className="max-w-3xl mx-auto text-center py-20 border border-white/15">
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-4">
                Coming soon
              </p>
              <p className="font-display uppercase text-3xl md:text-5xl leading-[0.9] tracking-tight">
                New offers brewing.
              </p>
              <p className="mt-6 font-cb-sans opacity-70 max-w-xl mx-auto">
                Check back soon — or sign up to Bears Den and we'll tell you first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {offers.map((o) => (
                <article key={o.id} className="border border-white/15 flex flex-col">
                  {o.image_url && (
                    <img
                      src={o.image_url}
                      alt={o.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="font-display uppercase text-2xl tracking-tight leading-tight">
                      {o.title}
                    </h2>
                    {o.body && (
                      <p className="mt-3 font-cb-sans opacity-80 text-sm flex-1">{o.body}</p>
                    )}
                    {o.cta_path && (
                      <a
                        href={o.cta_path}
                        className="mt-6 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-5 py-3 hover:bg-white hover:text-black transition-colors self-start"
                      >
                        {o.cta_label ?? "Read more"}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <CBFooter />
    </>
  );
};

export default OffersLanding;
