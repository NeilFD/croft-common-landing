import NotificationsPageLayout from "@/components/NotificationsPageLayout";
import PersonalizedMessageBox from "@/components/PersonalizedMessageBox";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
    if (fromUrl) {
      // Store in session for future reference
      try {
        sessionStorage.setItem('notifications.last_ntk', fromUrl);
      } catch {}
      return fromUrl;
    }
    try {
      return sessionStorage.getItem('notifications.last_ntk');
    } catch {
      return null;
    }
  }, [search]);

  const userId = useMemo(() => search.get('user'), [search]);

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
        // Track notification click
        const { error: trackError } = await supabase.functions.invoke('track-notification-event', {
          body: { 
            type: 'notification_open', 
            token, 
            url: window.location.href,
            user_id: userId 
          },
        });
        if (trackError) {
          console.warn('[Notifications] track error', trackError);
        }

        // Get personalization data
        const { data, error } = await supabase.functions.invoke('resolve-notification-personalization', {
          body: { token, url: window.location.href, user_id: userId },
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
  }, [token, userId]);

  return (
    <NotificationsPageLayout>
      <PersonalizedMessageBox firstName={firstName}>
        <p>
          Pop down to Croft Common to soak up the Membership benefits in the sun tomorrow
        </p>
        <p className="mt-8 text-right font-industrial text-base">
          - Croft Common
        </p>
      </PersonalizedMessageBox>
    </NotificationsPageLayout>
  );
}