import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CBStaticPage from "@/components/crazybear/CBStaticPage";

interface JournalPost {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  hero_url: string | null;
  author: string | null;
  tags: string[] | null;
  published_at: string | null;
  reading_minutes: number | null;
}

const Journal = () => {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cb_journal_posts" as any)
        .select("id,title,slug,excerpt,hero_url,author,tags,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (data) setPosts(data as unknown as JournalPost[]);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = tag ? posts.filter((p) => (p.tags ?? []).includes(tag)) : posts;

  return (
    <CBStaticPage
      title="Journal"
      intro={"Notes from inside the Bear.\nFood, music, mischief, occasionally a manifesto."}
      seoDescription="The Crazy Bear Journal. Food, music, design notes and mischief from inside Crazy Bear Town and Country."
      path="/journal"
      cmsPage="journal"
    >
      {allTags.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={`font-cb-mono text-[10px] tracking-[0.4em] uppercase px-3 py-2 border ${
              tag === null ? "bg-foreground text-background border-foreground" : "border-foreground/30 hover:border-foreground"
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={`font-cb-mono text-[10px] tracking-[0.4em] uppercase px-3 py-2 border ${
                tag === t ? "bg-foreground text-background border-foreground" : "border-foreground/30 hover:border-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-center font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Loading…</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-center font-cb-sans text-lg opacity-80">
          The first post is on its way. Pour yourself something while you wait.
        </p>
      )}

      <ul className="space-y-12">
        {filtered.map((p) => (
          <li key={p.id} className="border-t border-foreground/15 pt-8">
            <Link to={`/journal/${p.slug}`} className="block group md:grid md:grid-cols-3 md:gap-8">
              {p.hero_url && (
                <img
                  src={p.hero_url}
                  alt={p.title}
                  width={800}
                  height={600}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover bg-muted md:col-span-1"
                />
              )}
              <div className={p.hero_url ? "md:col-span-2 mt-4 md:mt-0" : ""}>
                {p.published_at && (
                  <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                    {new Date(p.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {p.author ? ` · ${p.author}` : ""}
                  </p>
                )}
                <h2 className="mt-3 font-serif text-3xl uppercase group-hover:underline">{p.title}</h2>
                {p.excerpt && <p className="mt-3 font-cb-sans text-lg opacity-85">{p.excerpt}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </CBStaticPage>
  );
};

export default Journal;
