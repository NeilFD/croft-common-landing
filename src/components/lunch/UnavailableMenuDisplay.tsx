import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLunchRun } from "@/hooks/useLunchRun";
import { useEffect } from "react";

export const UnavailableMenuDisplay = () => {
  const { menu, loading, loadMenuAndAvailability } = useLunchRun();

  useEffect(() => {
    console.log('📱 UnavailableMenuDisplay mounted, calling loadMenuAndAvailability');
    loadMenuAndAvailability();
  }, [loadMenuAndAvailability]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const sandwiches = menu.sandwiches || [];
  const beverages = menu.beverages || [];

  // Helper function to convert image URLs to proper absolute URLs
  const getProperImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    
    console.log('🔍 Processing image URL:', imageUrl);
    
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('✅ Already absolute URL:', imageUrl);
      return imageUrl;
    }
    
    // For lovable-uploads paths, convert to absolute URL
    if (imageUrl.startsWith('/lovable-uploads/')) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const absoluteUrl = `${baseUrl}${imageUrl}`;
      console.log('🔗 Converting lovable-uploads URL:', { original: imageUrl, absolute: absoluteUrl });
      return absoluteUrl;
    }
    
    // Convert any relative path to absolute URL
    if (imageUrl.startsWith('/')) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const absoluteUrl = `${baseUrl}${imageUrl}`;
      console.log('🔗 Converting relative URL:', { original: imageUrl, absolute: absoluteUrl });
      return absoluteUrl;
    }
    
    console.log('📝 Returning URL unchanged:', imageUrl);
    return imageUrl;
  };

  // Debug logging for menu data and image URLs
  console.log('🍽️ Menu data loaded:', { sandwiches: sandwiches.length, beverages: beverages.length });
  if (sandwiches.length > 0) {
    console.log('🥪 Sandwich image URLs:', sandwiches.map(s => ({ 
      name: s.name, 
      original: s.image_url, 
      resolved: getProperImageUrl(s.image_url) 
    })));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Our Menu</h2>
        <p className="text-muted-foreground">
          Orders close at 11:00 AM, but here's what we'll be serving today
        </p>
      </div>

      {/* Sandwiches */}
      {sandwiches.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold">Sandwiches</h3>
            <Badge variant="secondary">{sandwiches.length} available</Badge>
          </div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            {sandwiches.map((item) => {
              const properImageUrl = getProperImageUrl(item.image_url);
              return (
                <Card key={item.id} className="h-full overflow-hidden">
                  {properImageUrl && (
                    <div className="aspect-[4/3] relative">
                      <img
                        src={properImageUrl}
                        alt={`${item.name} sandwich`}
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('✅ Sandwich image loaded:', properImageUrl)}
                        onError={(e) => {
                          console.error('❌ Sandwich image failed to load:', properImageUrl);
                          console.error('Original URL:', item.image_url);
                          console.error('Error details:', e);
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-lg leading-tight">{item.name}</h4>
                      <span className="font-bold text-primary text-lg">£{item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Beverages */}
      {beverages.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold">Beverages</h3>
            <Badge variant="secondary">{beverages.length} available</Badge>
          </div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beverages.map((item) => {
              const properImageUrl = getProperImageUrl(item.image_url);
              return (
                <Card key={item.id} className="h-full overflow-hidden">
                  {properImageUrl && (
                    <div className="aspect-[4/3] relative">
                      <img
                        src={properImageUrl}
                        alt={`${item.name} beverage`}
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('✅ Beverage image loaded:', properImageUrl)}
                        onError={(e) => {
                          console.error('❌ Beverage image failed to load:', properImageUrl);
                          console.error('Original URL:', item.image_url);
                          console.error('Error details:', e);
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-lg leading-tight">{item.name}</h4>
                      <span className="font-bold text-primary text-lg">£{item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Orders open again tomorrow at 9:00 AM • Collection from 12:00 PM onwards
        </p>
      </div>
    </div>
  );
};