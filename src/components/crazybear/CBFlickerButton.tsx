import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bear from '@/assets/crazy-bear-mark.png';
import koi from '@/assets/curious-flicker/koi.png';
import microphone from '@/assets/curious-flicker/microphone.png';
import dancer from '@/assets/curious-flicker/dancer.png';
import steak from '@/assets/curious-flicker/steak.png';
import bed from '@/assets/curious-flicker/bed.png';
import cocktail from '@/assets/curious-flicker/cocktail.png';

const FRAMES = [
  { src: bear, alt: 'Crazy Bear' },
  { src: koi, alt: 'Koi carp' },
  { src: microphone, alt: 'Karaoke microphone' },
  { src: dancer, alt: 'Dancing lady' },
  { src: steak, alt: 'Steak' },
  { src: bed, alt: 'Hotel bed' },
  { src: cocktail, alt: 'Cocktail' },
];

const INTERVAL_MS = 500;

interface Props {
  hidden: boolean;
  bottomClass: string;
}

const CBFlickerButton: React.FC<Props> = ({ hidden, bottomClass }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % FRAMES.length);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 60);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const frame = FRAMES[index];

  return (
    <button
      type="button"
      aria-label="Curious"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={() => navigate('/curious')}
      className={`fixed ${bottomClass} right-3 md:right-8 z-40 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-transparent border-0 outline-none transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hidden ? 'translate-x-[140%] motion-reduce:translate-x-0' : 'translate-x-0'
      }`}
    >
      <img
        src={frame.src}
        alt={frame.alt}
        width={512}
        height={512}
        loading="lazy"
        draggable={false}
        className={`w-full h-full object-contain select-none pointer-events-none transition-[transform,opacity] duration-[60ms] ${
          flash ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
        }`}
      />
    </button>
  );
};

export default CBFlickerButton;
