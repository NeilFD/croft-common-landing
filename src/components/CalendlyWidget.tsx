import React, { useEffect, useRef } from 'react';

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
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Calendly script if not already loaded
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        console.log('Calendly script loaded successfully');
        initWidget();
      };
      script.onerror = () => {
        console.error('Failed to load Calendly script');
      };
      document.head.appendChild(script);
    } else {
      // Script already exists, check if Calendly is available
      if (window.Calendly) {
        initWidget();
      } else {
        // Wait for existing script to load
        const checkCalendly = setInterval(() => {
          if (window.Calendly) {
            clearInterval(checkCalendly);
            initWidget();
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkCalendly), 10000);
      }
    }

    function initWidget() {
      if (widgetRef.current && window.Calendly) {
        console.log('Initializing Calendly widget with URL:', url);
        // Clear any existing content
        widgetRef.current.innerHTML = '';
        
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: widgetRef.current
        });
      }
    }
  }, [url]);

  return (
    <div 
      ref={widgetRef}
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