import React, { useEffect } from 'react';

interface CalendlyWidgetProps {
  url: string;
  className?: string;
  height?: number;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

export const CalendlyWidget: React.FC<CalendlyWidgetProps> = ({ 
  url, 
  className = "", 
  height = 700 
}) => {
  useEffect(() => {
    // Load Calendly script if not already loaded
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize widget when script loads
    const initWidget = () => {
      const element = document.querySelector('.calendly-inline-widget');
      if (element && window.Calendly) {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: element as HTMLElement
        });
      }
    };

    // Check if Calendly is already loaded
    if (window.Calendly) {
      initWidget();
    } else {
      // Wait for script to load
      const checkCalendly = setInterval(() => {
        if (window.Calendly) {
          clearInterval(checkCalendly);
          initWidget();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkCalendly), 10000);
    }
  }, [url]);

  return (
    <div 
      className={`calendly-inline-widget bg-white rounded-lg overflow-hidden ${className}`}
      data-url={url}
      style={{ minWidth: '320px', height: `${height}px` }}
    >
      {/* Fallback content */}
      <div className="flex items-center justify-center h-full text-gray-600">
        <div className="text-center">
          <p className="mb-4">Calendar widget loading...</p>
          <a 
            href={url}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here to schedule directly
          </a>
        </div>
      </div>
    </div>
  );
};