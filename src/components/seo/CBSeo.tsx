import { Helmet } from "react-helmet-async";

const SITE = "https://www.crazybeartest.com";

interface CBSeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export const CBSeo = ({
  title,
  description,
  path,
  image = "/brand/logo.png",
  type = "website",
  jsonLd,
}: CBSeoProps) => {
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  const fullImage = image.startsWith("http") ? image : `${SITE}${image}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Crazy Bear" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
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
