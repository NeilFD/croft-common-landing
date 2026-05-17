import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_url: string | null;
  published_at: string | null;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cb_stories" as any)
        .select("id,title,slug,excerpt,hero_url,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (data) setStories(data as unknown as Story[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <CBSeo
        title="Stories from the Bear | Crazy Bear"
        description="Stories from the Bear. Wild nights, near-misses and three decades of mischief at Crazy Bear Town and Country."
        path="/stories"
        jsonLd={[breadcrumbSchema("/stories")]}
      />
      <section className="relative bg-black text-white py-24 md:py-32 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">Crazy Bear</p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl uppercase">Stories from the Bear</h1>
          <p className="mt-6 font-cb-sans text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Wild nights. Near-misses. Three decades of mischief, on the record. Most of it.
          </p>
        </div>
      </section>

      <section className="bg-background text-foreground px-6 py-16">
        <div className="mx-auto max-w-4xl">
          {loading && (
            <p className="text-center font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
              Loading…
            </p>
          )}
          {!loading && stories.length === 0 && (
            <p className="text-center font-cb-sans text-lg opacity-80">
              The first story is coming soon. Pour yourself something while you wait.
            </p>
          )}
          <ul className="space-y-12">
            {stories.map((s) => (
              <li key={s.id} className="border-t border-foreground/15 pt-8">
                <Link to={`/stories/${s.slug}`} className="block group md:grid md:grid-cols-3 md:gap-8">
                  {s.hero_url && (
                    <img
                      src={s.hero_url}
                      alt={s.title}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="w-full aspect-[4/3] object-cover bg-muted md:col-span-1"
                    />
                  )}
                  <div className={s.hero_url ? "md:col-span-2 mt-4 md:mt-0" : ""}>
                    {s.published_at && (
                      <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                        {new Date(s.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                    <h2 className="mt-3 font-serif text-3xl uppercase group-hover:underline">{s.title}</h2>
                    {s.excerpt && <p className="mt-3 font-cb-sans text-lg opacity-85">{s.excerpt}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default Stories;
