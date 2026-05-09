import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMemberMoments, type MemberMoment } from '@/hooks/useMemberMoments';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import OptimizedImage from '@/components/OptimizedImage';

const MemberMomentsCarousel: React.FC = () => {
  const { moments, loading } = useMemberMoments();
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);

  const memberName = (m: MemberMoment) => {
    if (m.profiles?.first_name || m.profiles?.last_name) {
      return `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim();
    }
    return 'Member';
  };

  const formatShort = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">Loading</div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="font-display uppercase text-2xl tracking-tight mb-3">No moments yet</p>
        <p className="font-sans text-sm text-white/60 mb-5">Be the first.</p>
        <Link
          to="/den/member/moments"
          className="inline-block px-6 h-10 leading-10 border border-white/40 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors"
        >
          Open Moments
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <Carousel
          className="w-full"
          opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps' }}
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {moments.slice(0, 12).map((moment) => (
              <CarouselItem
                key={moment.id}
                className="pl-2 md:pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMoment(moment)}
                  className="block w-full text-left group"
                >
                  <div className="aspect-square relative overflow-hidden border border-white/10 group-hover:border-white transition-colors">
                    <OptimizedImage
                      src={moment.image_url}
                      alt={moment.tagline || 'Moment'}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {moment.tagline && (
                      <p className="font-sans text-xs text-white line-clamp-2">{moment.tagline}</p>
                    )}
                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">
                      {memberName(moment)} · {formatShort(moment.uploaded_at)}
                    </p>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex bg-black border-white/40 text-white hover:bg-white hover:text-black" />
          <CarouselNext className="hidden sm:flex bg-black border-white/40 text-white hover:bg-white hover:text-black" />
        </Carousel>

        <div className="mt-5 text-center">
          <Link
            to="/den/member/moments"
            className="inline-block px-6 h-10 leading-10 border border-white/40 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors"
          >
            See All
          </Link>
        </div>
      </div>

      {selectedMoment && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMoment(null)}
        >
          <div
            className="bg-black border border-white/15 max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center bg-black min-h-[50vh]">
              <img
                src={selectedMoment.image_url}
                alt={selectedMoment.tagline || 'Moment'}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-5 border-t border-white/10 text-white">
              {selectedMoment.tagline && (
                <h3 className="font-display uppercase text-xl tracking-tight mb-3">
                  {selectedMoment.tagline}
                </h3>
              )}
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                  {memberName(selectedMoment)} ·{' '}
                  {new Date(selectedMoment.uploaded_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedMoment(null)}
                  className="px-4 h-9 border border-white/40 font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberMomentsCarousel;
