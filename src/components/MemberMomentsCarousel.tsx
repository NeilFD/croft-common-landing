import React, { useState } from 'react';
import { useMemberMoments, type MemberMoment } from '@/hooks/useMemberMoments';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Camera } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const MemberMomentsCarousel: React.FC = () => {
  const { moments, loading } = useMemberMoments();
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);
  
  // Mobile debugging
  console.log('[MemberMomentsCarousel] 📱 MOBILE: Rendering carousel', {
    momentsCount: moments?.length || 0,
    loading,
    viewport: { width: window.innerWidth, height: window.innerHeight }
  });

  const getMemberName = (moment: MemberMoment) => {
    if (moment.profiles) {
      const { first_name, last_name } = moment.profiles;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
    }
    return 'Member';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="w-full mb-8">
        <div className="bg-white rounded-2xl p-6 border-2 border-black">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Member Moments
          </h2>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="w-full mb-8">
        <div className="bg-white rounded-2xl p-6 border-2 border-black">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Member Moments
          </h2>
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No moments shared yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full mb-8">
      <div className="bg-white rounded-2xl p-6 border-2 border-black hover:border-pink-500 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Member Moments</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : moments && moments.length > 0 ? (
          <div className="mobile-safe-carousel">
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                dragFree: true,
                containScroll: "trimSnaps"
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {moments.map((moment) => (
                  <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-pink-300"
                      onClick={() => {
                        console.log('[MemberMomentsCarousel] 🖱️ MOBILE: Moment clicked', {
                          id: moment.id,
                          imageUrl: moment.image_url,
                          tagline: moment.tagline
                        });
                        console.log('[MemberMomentsCarousel] 🖼️ Full moment object:', moment);
                        setSelectedMoment(moment);
                      }}
                    >
                      <CardContent className="p-2">
                        <div className="aspect-square relative rounded-lg overflow-hidden mb-2">
                          <OptimizedImage
                            src={moment.image_url}
                            alt={moment.tagline || 'Member moment'}
                            className="w-full h-full object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        </div>
                        <div className="space-y-1">
                          {moment.tagline && (
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">{moment.tagline}</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{moment.profiles?.first_name || 'Member'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(moment.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No moments shared yet</p>
          </div>
        )}
      </div>
    </div>

      {/* Enlarged Image Modal */}
      <Dialog open={!!selectedMoment} onOpenChange={() => setSelectedMoment(null)}>
        <DialogContent className="max-w-4xl p-4 border-2 border-black bg-white">
          {selectedMoment && (() => {
            console.log('[MemberMomentsCarousel] 🖼️ MODAL: Rendering image in modal', {
              imageUrl: selectedMoment.image_url,
              tagline: selectedMoment.tagline
            });
            return (
              <div className="relative bg-white min-h-[400px]">
                <div className="w-full h-[70vh] bg-gray-50 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={selectedMoment.image_url}
                    alt={selectedMoment.tagline || 'Member moment'}
                    className="w-full h-full"
                    priority={true}
                    onLoad={() => console.log('[MemberMomentsCarousel] ✅ MODAL: Image loaded successfully')}
                  />
                </div>
                <div className="mt-4 p-4 bg-gray-900/90 rounded-lg">
                  {selectedMoment.tagline && (
                    <h3 className="text-white text-lg font-semibold mb-2">
                      {selectedMoment.tagline}
                    </h3>
                  )}
                  <div className="flex items-center gap-4 text-sm text-white/90">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {getMemberName(selectedMoment)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedMoment.uploaded_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberMomentsCarousel;