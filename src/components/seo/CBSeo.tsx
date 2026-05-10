import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://www.crazybear.dev";

interface CBSeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any> | Record<string, any>[];
  /** When set, emits a high-priority preload for the LCP hero image so
   *  the browser starts fetching it in parallel with the JS bundle
   *  instead of waiting for React to mount. */
  lcpImage?: string;
}

interface Override {
  title?: string | null;
  description?: string | null;
  og_image?: string | null;
  noindex?: boolean | null;
  jsonld?: any;
}

// In-memory cache so we only fetch each route's overrides once per session
const overrideCache = new Map<string, Override | null>();

export const CBSeo = ({
  title,
  description,
  path,
  image = "/brand/logo.png",
  type = "website",
  jsonLd,
  lcpImage,
}: CBSeoProps) => {
  const [override, setOverride] = useState<Override | null>(
    overrideCache.get(path) ?? null
  );

  useEffect(() => {
    let cancelled = false;
    if (overrideCache.has(path)) {
      setOverride(overrideCache.get(path) ?? null);
      return;
    }
    supabase
      .from("seo_pages")
      .select("title,description,og_image,noindex,jsonld")
      .eq("route", path)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        overrideCache.set(path, data ?? null);
        setOverride(data ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const finalTitle = (override?.title || title)?.trim();
  const finalDescription = (override?.description || description)?.trim();
  const finalImage = override?.og_image || image;
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  const fullImage = finalImage.startsWith("http") ? finalImage : `${SITE}${finalImage}`;
  const noindex = override?.noindex === true;

  const baseLd = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const overrideLd = override?.jsonld
    ? Array.isArray(override.jsonld)
      ? override.jsonld
      : [override.jsonld]
    : [];
  const ldArray = [...baseLd, ...overrideLd];

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {lcpImage && (
        <link rel="preload" as="image" href={lcpImage} {...({ fetchpriority: "high" } as any)} />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Crazy Bear" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImage} />

      {ldArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export const CB_SITE = SITE;
