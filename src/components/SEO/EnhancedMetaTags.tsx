import { Helmet } from 'react-helmet-async';

interface EnhancedMetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  restaurant?: {
    cuisine?: string[];
    priceRange?: string;
    acceptsReservations?: boolean;
  };
  event?: {
    startDate?: string;
    endDate?: string;
    location?: string;
  };
}

export const EnhancedMetaTags = ({
  title,
  description,
  keywords = [],
  image = "https://croftcommon.co.uk/brand/logo.png",
  url = "https://croftcommon.co.uk",
  type = "website",
  article,
  restaurant,
  event
}: EnhancedMetaTagsProps) => {
  const fullTitle = title.includes('Croft Common') ? title : `${title} | Croft Common`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content="Croft Common" />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Croft Common" />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article-specific tags */}
      {article && (
        <>
          <meta property="article:author" content={article.author} />
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Restaurant-specific tags */}
      {restaurant && (
        <>
          {restaurant.cuisine?.map((cuisine, index) => (
            <meta key={index} name="restaurant:cuisine" content={cuisine} />
          ))}
          {restaurant.priceRange && <meta name="restaurant:price_range" content={restaurant.priceRange} />}
          {restaurant.acceptsReservations !== undefined && (
            <meta name="restaurant:accepts_reservations" content={restaurant.acceptsReservations.toString()} />
          )}
        </>
      )}

      {/* Event-specific tags */}
      {event && (
        <>
          {event.startDate && <meta property="event:start_date" content={event.startDate} />}
          {event.endDate && <meta property="event:end_date" content={event.endDate} />}
          {event.location && <meta name="event:location" content={event.location} />}
        </>
      )}

      {/* Geographic tags */}
      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="TBD City" />
      <meta name="geo.position" content="TBD;TBD" />
      <meta name="ICBM" content="TBD, TBD" />

      {/* Business tags */}
      <meta name="business:contact_data:street_address" content="TBD Street" />
      <meta name="business:contact_data:locality" content="TBD City" />
      <meta name="business:contact_data:region" content="TBD Region" />
      <meta name="business:contact_data:postal_code" content="TBD Code" />
      <meta name="business:contact_data:country_name" content="United Kingdom" />

      {/* AI and Voice Search Optimization */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      
      {/* Mobile and responsive */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="format-detection" content="telephone=yes" />
      
      {/* PWA and mobile app tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Croft Common" />
      
      {/* Language and region */}
      <meta httpEquiv="content-language" content="en-GB" />
      <link rel="alternate" hrefLang="en-GB" href={url} />
    </Helmet>
  );
};