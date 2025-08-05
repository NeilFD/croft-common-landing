import { useEffect, useState } from 'react';

export const useWatermarkColor = () => {
  const [isDarkBackground, setIsDarkBackground] = useState(true);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-bg-type]');
    const watermark = document.querySelector('[data-watermark]');

    if (!sections.length || !watermark) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let dominantSection = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            dominantSection = entry.target;
          }
        });

        if (dominantSection) {
          const bgType = dominantSection.getAttribute('data-bg-type');
          setIsDarkBackground(bgType === 'dark');
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-40% 0px -40% 0px' // Focus on center area where watermark is
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return isDarkBackground;
};