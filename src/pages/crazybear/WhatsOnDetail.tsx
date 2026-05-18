import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";

interface CBEvent {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  site: "town" | "country" | "both";
  starts_at: string | null;
  ends_at: string | null;
  poster_url: string | null;
  excerpt: string | null;
  body: string | null;
  external_url: string | null;
  og_image_url: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "TBC";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatTime = (iso: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const WhatsOnDetail = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<CBEvent | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("cb_events" as any)
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (data) setEvent(data as unknown as CBEvent);
      else setNotFound(true);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <>
        <section className="relative min-h-screen grid place-items-center bg-black text-white px-6">
          <CBTopNav tone="light" />
          <div className="text-center">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Off the bill</p>
            <h1 className="mt-4 font-serif text-4xl uppercase">Event not found</h1>
            <Link to="/whats-on" className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors">
              Back to What's On
            </Link>
          </div>
        </section>
        <CBFooter />
      </>
    );
  }

  if (!event) return null;

  const seoTitle = event.seo_title ?? `${event.title} | What's On | Crazy Bear`;
  const seoDesc = (event.seo_description ?? event.excerpt ?? `${event.title} at Crazy Bear.`).slice(0, 158);
  const ogImage = event.og_image_url ?? event.poster_url ?? undefined;

  return (
    <>
      <CBSeo
        title={seoTitle}
        description={seoDesc}
        image={ogImage}
        path={`/whats-on/${event.slug}`}
        jsonLd={[breadcrumbSchema(`/whats-on/${event.slug}`)]}
      />
      {event.poster_url ? (
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black text-white">
          <img src={event.poster_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <CBTopNav tone="light" />
        </section>
      ) : (
        <section className="relative bg-black text-white pt-40 md:pt-48 pb-12 px-6">
          <CBTopNav tone="light" />
        </section>
      )}
      <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
          {formatDate(event.starts_at)}
          {formatTime(event.starts_at) ? ` · ${formatTime(event.starts_at)}` : ""}
          {` · ${event.site === "both" ? "Town & Country" : event.site === "town" ? "Town" : "Country"}`}
        </p>
        <h1 className="mt-4 font-serif text-4xl md:text-6xl uppercase">{event.title}</h1>
        {event.subtitle && (
          <p className="mt-4 font-cb-sans text-xl md:text-2xl opacity-80">{event.subtitle}</p>
        )}
        {event.excerpt && (
          <p className="mt-6 font-cb-sans text-xl leading-relaxed opacity-90">{event.excerpt}</p>
        )}
        {event.body && (
          <div
            className="cb-prose mt-10 font-cb-sans text-lg leading-relaxed opacity-90 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: event.body }}
          />
        )}
        {event.external_url && (
          <a href={event.external_url} target="_blank" rel="noreferrer noopener" className="mt-10 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors">
            Book / Tickets
          </a>
        )}
        <div className="mt-6">
          <Link to="/whats-on" className="inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors">
            More on the bill
          </Link>
        </div>
      </article>
      <CBFooter />
    </>
  );
};

export default WhatsOnDetail;
