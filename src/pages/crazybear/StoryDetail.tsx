import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_url: string | null;
  published_at: string | null;
}

const StoryDetail = () => {
  const { slug } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("cb_stories" as any)
        .select("id,title,slug,excerpt,body,hero_url,published_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (data) setStory(data as unknown as Story);
      else setNotFound(true);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <section className="min-h-screen grid place-items-center bg-background text-foreground px-6">
        <div className="text-center">
          <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Lost in the woods</p>
          <h1 className="mt-4 font-serif text-4xl uppercase">Story not found</h1>
          <Link
            to="/stories"
            className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
          >
            Back to stories
          </Link>
        </div>
      </section>
    );
  }

  if (!story) return null;

  return (
    <>
      <CBSeo
        title={`${story.title} | Stories from the Bear`}
        description={story.excerpt ?? `${story.title}. A story from Crazy Bear.`}
        path={`/stories/${story.slug}`}
        jsonLd={[breadcrumbSchema(`/stories/${story.slug}`)]}
      />
      {story.hero_url && (
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black text-white">
          <img src={story.hero_url} alt={story.title} width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </section>
      )}
      <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        {story.published_at && (
          <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
            {new Date(story.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <h1 className="mt-4 font-serif text-4xl md:text-6xl uppercase">{story.title}</h1>
        {story.excerpt && (
          <p className="mt-6 font-cb-sans text-xl leading-relaxed opacity-90">{story.excerpt}</p>
        )}
        {story.body && (
          <div className="mt-10 font-cb-sans text-lg leading-relaxed whitespace-pre-line opacity-90">
            {story.body}
          </div>
        )}
        <Link
          to="/stories"
          className="mt-16 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
        >
          More stories
        </Link>
      </article>
    </>
  );
};

export default StoryDetail;
