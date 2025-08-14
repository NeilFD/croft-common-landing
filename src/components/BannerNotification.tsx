import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BannerNotificationData {
  title: string;
  body: string;
  bannerMessage?: string;
  url?: string;
  icon?: string;
  notificationId: string;
  clickToken?: string;
}

interface BannerNotificationProps {
  data: BannerNotificationData;
  onDismiss: () => void;
  autoHideDelay?: number;
}

export const BannerNotification: React.FC<BannerNotificationProps> = ({
  data,
  onDismiss,
  autoHideDelay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-hide timer
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for fade out animation
  };

  const handleClick = () => {
    if (data.url) {
      window.open(data.url, '_blank');
    }
    handleDismiss();
  };

  // Extract the correct banner message
  const displayMessage = data.bannerMessage || data.body;
  
  console.log('🔔 Banner: Rendering with message:', {
    title: data.title,
    originalBody: data.body,
    bannerMessage: data.bannerMessage,
    displayMessage,
    hasCustomBanner: !!data.bannerMessage
  });


  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-black/60
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleDismiss}
    >
      <div 
        className={`
          relative mx-4 max-w-md w-full bg-background border border-border rounded-lg shadow-xl
          transform transition-all duration-300
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6">
          {/* Header with icon */}
          <div className="flex items-start gap-3 mb-4">
            {data.icon && (
              <img
                src={data.icon}
                alt="Notification icon"
                className="w-10 h-10 rounded-lg shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">
                {data.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Croft Common
              </p>
            </div>
          </div>

          {/* Main message */}
          <div className="mb-6">
            <p className="text-foreground leading-relaxed">
              {displayMessage}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
            {data.url && (
              <Button
                onClick={handleClick}
              >
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};