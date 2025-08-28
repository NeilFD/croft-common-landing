import React, { useState } from 'react';
import { useMemberMoments } from '@/hooks/useMemberMoments';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Camera, Heart } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

interface MemberMoment {
  id: string;
  user_id: string;
  image_url: string;
  tagline: string | null;
  uploaded_at: string;
  like_count: number;
  user_has_liked: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
  } | null;
}

const MemberMomentsCarousel: React.FC = () => {
  const { moments, loading, toggleLike } = useMemberMoments();
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);

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
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Member Moments
          </h2>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {moments.map((moment) => (
                <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card 
                    className="border-2 border-black hover:border-pink-500 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden"
                    onClick={() => setSelectedMoment(moment)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square relative overflow-hidden">
                        <OptimizedImage
                          src={moment.image_url}
                          alt={moment.tagline || 'Member moment'}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Like button */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(moment.id);
                            }}
                            className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-medium hover:bg-black/70 transition-colors"
                          >
                            <Heart
                              className={`h-3 w-3 ${moment.user_has_liked ? 'fill-white text-white' : 'fill-white/70 text-white'}`}
                            />
                            {moment.like_count}
                          </button>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          {moment.tagline && (
                            <p className="text-white text-sm font-medium mb-2 line-clamp-2">
                              {moment.tagline}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-white/80">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getMemberName(moment)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(moment.uploaded_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 border-2 border-black hover:border-pink-500 bg-white hover:bg-pink-50" />
            <CarouselNext className="hidden md:flex -right-12 border-2 border-black hover:border-pink-500 bg-white hover:bg-pink-50" />
          </Carousel>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <Dialog open={!!selectedMoment} onOpenChange={() => setSelectedMoment(null)}>
        <DialogContent className="max-w-4xl p-0 border-2 border-black">
          {selectedMoment && (
            <div className="relative">
              <OptimizedImage
                src={selectedMoment.image_url}
                alt={selectedMoment.tagline || 'Member moment'}
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberMomentsCarousel;