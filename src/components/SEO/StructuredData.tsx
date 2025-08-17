import { useEffect } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
}

export const StructuredData = ({ data }: StructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      // Clean up script on unmount
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script might already be removed
      }
    };
  }, [data]);

  return null;
};

// Restaurant/Local Business Schema
export const useRestaurantSchema = (page: string) => {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness"],
    "name": "Croft Common",
    "description": "A vibrant community space offering exceptional food, craft beer, cocktails, and events in the heart of the community.",
    "url": "https://croftcommon.co.uk",
    "telephone": "+44-XXX-XXX-XXXX", // Add real phone
    "email": "hello@croftcommon.co.uk",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "TBD Street", // Add real address
      "addressLocality": "TBD City",
      "addressRegion": "TBD Region",
      "postalCode": "TBD Code",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "TBD", // Add real coordinates
      "longitude": "TBD"
    },
    "openingHours": [
      "Mo-Su 09:00-23:00" // Update with real hours
    ],
    "servesCuisine": ["British", "International", "Pub Food"],
    "priceRange": "££",
    "acceptsReservations": true,
    "hasMenu": true,
    "image": [
      "https://croftcommon.co.uk/brand/logo.png"
    ],
    "sameAs": [
      // Add social media URLs when available
    ]
  };

  return baseSchema;
};

// Event Schema
export const useEventSchema = (event: any) => {
  if (!event) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description,
    "startDate": event.date + "T" + event.time,
    "location": {
      "@type": "Place",
      "name": "Croft Common",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "TBD Street",
        "addressLocality": "TBD City",
        "addressRegion": "TBD Region",
        "postalCode": "TBD Code",
        "addressCountry": "GB"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": event.organizer,
      "email": event.contact_email
    },
    "offers": event.price ? {
      "@type": "Offer",
      "price": event.price,
      "priceCurrency": "GBP",
      "availability": event.is_sold_out ? "http://schema.org/SoldOut" : "http://schema.org/InStock"
    } : undefined,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
  };
};

// Menu Schema
export const useMenuSchema = (menuItems: any[], page: string) => {
  if (!menuItems?.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": `${page.charAt(0).toUpperCase() + page.slice(1)} Menu - Croft Common`,
    "description": `Discover our ${page} offerings at Croft Common`,
    "hasMenuSection": menuItems.map(section => ({
      "@type": "MenuSection",
      "name": section.section_name,
      "hasMenuItem": section.items?.map((item: any) => ({
        "@type": "MenuItem",
        "name": item.item_name,
        "description": item.description,
        "offers": item.price ? {
          "@type": "Offer",
          "price": item.price.replace(/[^\d.]/g, ''),
          "priceCurrency": "GBP"
        } : undefined
      })) || []
    }))
  };
};

// Organization Schema
export const useOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Croft Common",
    "url": "https://croftcommon.co.uk",
    "logo": "https://croftcommon.co.uk/brand/logo.png",
    "description": "A vibrant community space bringing people together through exceptional food, craft beer, cocktails, and memorable events.",
    "foundingDate": "2024", // Update with real date
    "email": "hello@croftcommon.co.uk",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "TBD Street",
      "addressLocality": "TBD City", 
      "addressRegion": "TBD Region",
      "postalCode": "TBD Code",
      "addressCountry": "GB"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+44-XXX-XXX-XXXX",
      "contactType": "customer service",
      "email": "hello@croftcommon.co.uk"
    }
  };
};

// Breadcrumb Schema
export const useBreadcrumbSchema = (path: string) => {
  const pathSegments = path.split('/').filter(Boolean);
  
  const itemListElement = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://croftcommon.co.uk"
    }
  ];

  pathSegments.forEach((segment, index) => {
    const url = "https://croftcommon.co.uk/" + pathSegments.slice(0, index + 1).join('/');
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    itemListElement.push({
      "@type": "ListItem",
      "position": index + 2,
      "name": name,
      "item": url
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
};