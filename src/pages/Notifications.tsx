import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const setMeta = (opts: { title: string; description?: string; canonical?: string }) => {
  document.title = opts.title;
  if (opts.description) {
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = opts.description;
  }
  if (opts.canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = opts.canonical;
  }
};

export default function Notifications() {
  const [search] = useSearchParams();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => {
    const fromUrl = search.get('ntk');
    if (fromUrl) return fromUrl;
    try {
      return sessionStorage.getItem('notifications.last_ntk');
    } catch {
      return null;
    }
  }, [search]);

  useEffect(() => {
    setMeta({
      title: "Notifications | Croft Common",
      description: "Personalised notifications and offers from Croft Common.",
      canonical: `${window.location.origin}/notifications`,
    });
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('resolve-notification-personalization', {
          body: { token, url: window.location.href },
        });
        if (error) {
          console.warn('[Notifications] resolve error', error);
        }
        if (!active) return;
        setFirstName((data as any)?.first_name ?? null);
      } catch (e) {
        console.warn('[Notifications] resolve exception', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [token]);

  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';

  return (
    <PageLayout>
      <main className="container mx-auto px-6 py-12">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">{greeting}</h1>
          <p className="text-lg text-muted-foreground mb-6">
            We’ve got a few tables left tonight — want to come see us?
          </p>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link to="/book" aria-label="Book a table at Croft Common">
                Book a table
              </Link>
            </Button>
            <a
              className="underline text-primary"
              href="https://www.croftcommon.com/book"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open booking in new tab
            </a>
          </div>
          {!loading && !firstName && (
            <p className="text-sm text-muted-foreground mt-6">
              P.S. We couldn’t personalise this message — but we’d still love to see you!
            </p>
          )}
        </section>
      </main>
    </PageLayout>
  );
}
