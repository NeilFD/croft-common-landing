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

  // Helper function to get the correct Lovable upload URL
  const getWorkingImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    
    console.log('🔍 Original image URL:', imageUrl);
    
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // For lovable-uploads, use the sandbox domain directly
    if (imageUrl.startsWith('/lovable-uploads/')) {
      // Use the current sandbox domain from the browser
      const sandboxUrl = `https://410602d4-4805-4fdf-8c51-900e548d9b20.sandbox.lovable.dev${imageUrl}`;
      console.log('🔧 Resolved to sandbox URL:', sandboxUrl);
      return sandboxUrl;
    }
    
    return imageUrl;
  };

  // Debug logging for menu data and image URLs
  console.log('🍽️ Menu data loaded:', { sandwiches: sandwiches.length, beverages: beverages.length });
  console.log('🌐 Current window location:', typeof window !== 'undefined' ? window.location.href : 'server-side');
  
  if (sandwiches.length > 0) {
    console.log('🥪 Sandwich image URLs:', sandwiches.map(s => ({ 
      name: s.name, 
      original: s.image_url, 
      resolved: getWorkingImageUrl(s.image_url) 
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
              const imageUrl = getWorkingImageUrl(item.image_url);
              return (
                <Card key={item.id} className="h-full overflow-hidden">
                  {item.image_url ? (
                    <div className="aspect-[4/3] relative bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${item.name} sandwich`}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('✅ SUCCESS: Image loaded for', item.name);
                          }}
                          onError={(e) => {
                            console.error('❌ FAILED: Image load failed for', item.name);
                            console.error('URL that failed:', imageUrl);
                            console.error('Original URL:', item.image_url);
                            
                            // Show visible error info
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            
                            // Add debug info to parent
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="p-4 text-xs text-red-600 bg-red-50">
                                  <div><strong>Image Load Failed</strong></div>
                                  <div>Original: ${item.image_url}</div>
                                  <div>Tried: ${imageUrl}</div>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                          <div className="text-center">
                            <div>No image URL</div>
                            <div className="text-xs mt-1">Original: {item.image_url}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
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
              const imageUrl = getWorkingImageUrl(item.image_url);
              return (
                <Card key={item.id} className="h-full overflow-hidden">
                  {item.image_url ? (
                    <div className="aspect-[4/3] relative bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${item.name} beverage`}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('✅ SUCCESS: Beverage image loaded for', item.name);
                          }}
                          onError={(e) => {
                            console.error('❌ FAILED: Beverage image load failed for', item.name);
                            console.error('URL that failed:', imageUrl);
                            console.error('Original URL:', item.image_url);
                            
                            // Show visible error info
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            
                            // Add debug info to parent
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="p-4 text-xs text-red-600 bg-red-50">
                                  <div><strong>Beverage Image Failed</strong></div>
                                  <div>Original: ${item.image_url}</div>
                                  <div>Tried: ${imageUrl}</div>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                          <div className="text-center">
                            <div>No image URL</div>
                            <div className="text-xs mt-1">Original: {item.image_url}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
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