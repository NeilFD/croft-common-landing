import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";

type SiteFilter = "both" | "town" | "country";

interface CBEvent {
  id: string;
  title: string;
  slug: string;
  site: "town" | "country" | "both";
  starts_at: string | null;
  ends_at: string | null;
  poster_url: string | null;
  body: string | null;
  external_url: string | null;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "TBC";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const SiteTag = ({ site }: { site: CBEvent["site"] }) => {
  if (site === "both") {
    return (
      <span className="inline-flex gap-1 font-cb-mono text-[9px] tracking-[0.4em] uppercase">
        <span className="px-2 py-1 bg-foreground text-background">Town</span>
        <span className="px-2 py-1 border border-foreground">Country</span>
      </span>
    );
  }
  const label = site === "town" ? "Town" : "Country";
  return (
    <span className="inline-block font-cb-mono text-[9px] tracking-[0.4em] uppercase px-2 py-1 bg-foreground text-background">
      {label}
    </span>
  );
};

const WhatsOn = () => {
  const [events, setEvents] = useState<CBEvent[]>([]);
  const [filter, setFilter] = useState<SiteFilter>("both");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("cb_events" as any)
        .select("id,title,slug,site,starts_at,ends_at,poster_url,body,external_url")
        .eq("published", true)
        .order("starts_at", { ascending: true });
      if (!error && data) setEvents(data as unknown as CBEvent[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "both") return events;
    return events.filter((e) => e.site === filter || e.site === "both");
  }, [events, filter]);

  return (
    <>
      <CBSeo
        title="What's Happening | Crazy Bear"
        description="What's happening at Crazy Bear. Events, parties, karaoke, cinema and feasts at Town and Country."
        path="/whats-on"
        jsonLd={[breadcrumbSchema("/whats-on")]}
      />
      <section className="relative bg-black text-white pt-40 md:pt-48 pb-24 md:pb-32 px-6">
        <CBTopNav tone="light" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
            Crazy Bear
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl uppercase">What's Happening</h1>
          <p className="mt-6 font-cb-sans text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Parties, karaoke, cinema, quiz nights, feasts. Pick your poison.
          </p>
        </div>
      </section>

      <section className="bg-background text-foreground px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Filter pills */}
          <div className="flex justify-center gap-3 mb-12">
            {(["both", "town", "country"] as const).map((s) => {
              const active = filter === s;
              const label = s === "both" ? "Both" : s === "town" ? "Town" : "Country";
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`font-cb-mono text-[10px] tracking-[0.4em] uppercase px-5 py-3 border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground/30 hover:border-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading && (
            <p className="text-center font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
              Loading…
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                Nothing on the books just yet.
              </p>
              <p className="mt-4 font-cb-sans text-lg opacity-80">Watch this space.</p>
            </div>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((e) => {
              const Wrapper = ({ children }: { children: React.ReactNode }) =>
                e.external_url ? (
                  <a href={e.external_url} target="_blank" rel="noreferrer noopener" className="block group">
                    {children}
                  </a>
                ) : (
                  <Link to={`/whats-on/${e.slug}`} className="block group">
                    {children}
                  </Link>
                );
              return (
                <li key={e.id} className="border-t border-foreground/15 pt-6">
                  <Wrapper>
                    {e.poster_url ? (
                      <img
                        src={e.poster_url}
                        alt={e.title}
                        width={800}
                        height={1000}
                        loading="lazy"
                        className="w-full aspect-[4/5] object-cover bg-muted transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full aspect-[4/5] bg-muted" />
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <SiteTag site={e.site} />
                      <span className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-70">
                        {formatDate(e.starts_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 font-serif text-2xl uppercase group-hover:underline">
                      {e.title}
                    </h2>
                    {e.body && (
                      <p className="mt-2 font-cb-sans text-sm opacity-80 line-clamp-3">{e.body}</p>
                    )}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <CBFooter />
    </>
  );
};

export default WhatsOn;
