import { useEffect, useState, useRef } from 'react';

export const useWatermarkColor = () => {
  const [watermarkColor, setWatermarkColor] = useState('255, 255, 255'); // Default white
  const sectionsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    // Get all sections
    const heroSection = document.querySelector('[data-section="hero"]') as HTMLElement;
    const aboutSection = document.querySelector('[data-section="about"]') as HTMLElement;
    const footerSection = document.querySelector('[data-section="footer"]') as HTMLElement;

    if (!heroSection || !aboutSection || !footerSection) return;

    sectionsRef.current = [heroSection, aboutSection, footerSection];

    const calculateWatermarkColor = () => {
      const watermarkElement = document.querySelector('[data-watermark="true"]');
      if (!watermarkElement) return;

      const watermarkRect = watermarkElement.getBoundingClientRect();
      const watermarkCenter = {
        top: watermarkRect.top + watermarkRect.height / 2,
        bottom: watermarkRect.bottom - watermarkRect.height / 2,
      };

      let totalOverlap = 0;
      let weightedColorValue = 0; // 0 = black, 1 = white

      sectionsRef.current.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionType = section.dataset.section;

        // Calculate overlap with watermark center area
        const overlapTop = Math.max(watermarkCenter.top, rect.top);
        const overlapBottom = Math.min(watermarkCenter.bottom, rect.bottom);
        const overlap = Math.max(0, overlapBottom - overlapTop);
        
        if (overlap > 0) {
          const overlapRatio = overlap / (watermarkCenter.bottom - watermarkCenter.top);
          totalOverlap += overlapRatio;

          // Dark sections (hero, footer) should make watermark white
          // Light sections (about) should make watermark black
          if (sectionType === 'hero' || sectionType === 'footer') {
            weightedColorValue += overlapRatio * 1; // White
          } else if (sectionType === 'about') {
            weightedColorValue += overlapRatio * 0; // Black
          }
        }
      });

      if (totalOverlap > 0) {
        const finalColorValue = weightedColorValue / totalOverlap;
        const rgbValue = Math.round(finalColorValue * 255);
        setWatermarkColor(`${rgbValue}, ${rgbValue}, ${rgbValue}`);
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(calculateWatermarkColor);
    };

    // Initial calculation
    calculateWatermarkColor();

    // Add scroll listener with throttling
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return watermarkColor;
};