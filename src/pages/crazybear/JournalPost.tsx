import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_url: string | null;
  author: string | null;
  published_at: string | null;
}

const JournalPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("cb_journal_posts" as any)
        .select("id,title,slug,excerpt,body,hero_url,author,published_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (data) setPost(data as unknown as Post);
      else setNotFound(true);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <>
        <section className="relative min-h-screen grid place-items-center bg-black text-white px-6">
          <CBTopNav tone="light" />
          <div className="text-center">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Lost in the woods</p>
            <h1 className="mt-4 font-serif text-4xl uppercase">Post not found</h1>
            <Link
              to="/journal"
              className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors"
            >
              Back to the Journal
            </Link>
          </div>
        </section>
        <CBFooter />
      </>
    );
  }

  if (!post) return null;

  return (
    <>
      <CBSeo
        title={`${post.title} | Journal | Crazy Bear`}
        description={(post.excerpt ?? `${post.title}. A note from inside Crazy Bear.`).slice(0, 158)}
        path={`/journal/${post.slug}`}
        jsonLd={[breadcrumbSchema(`/journal/${post.slug}`)]}
      />
      {post.hero_url ? (
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black text-white">
          <img src={post.hero_url} alt={post.title} width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <CBTopNav tone="light" />
        </section>
      ) : (
        <section className="relative bg-black text-white pt-40 md:pt-48 pb-12 px-6">
          <CBTopNav tone="light" />
        </section>
      )}
      <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        {post.published_at && (
          <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
            {new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {post.author ? ` · ${post.author}` : ""}
          </p>
        )}
        <h1 className="mt-4 font-serif text-4xl md:text-6xl uppercase">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-6 font-cb-sans text-xl leading-relaxed opacity-90">{post.excerpt}</p>
        )}
        {post.body && (
          <div className="mt-10 font-cb-sans text-lg leading-relaxed whitespace-pre-line opacity-90">
            {post.body}
          </div>
        )}
        <Link
          to="/journal"
          className="mt-16 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
        >
          More from the Journal
        </Link>
      </article>
      <CBFooter />
    </>
  );
};

export default JournalPost;
