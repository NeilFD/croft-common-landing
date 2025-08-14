import React from 'react';
import { Button } from '@/components/ui/button';
import { useBannerNotification } from '@/contexts/BannerNotificationContext';

export const TestBannerButton: React.FC = () => {
  const { showBanner } = useBannerNotification();

  const handleTestBanner = () => {
    showBanner({
      title: 'Test Banner',
      body: 'This is a test banner to verify the display functionality.',
      bannerMessage: 'Testing banner display when PWA is open',
      url: '/test',
      icon: '/favicon.ico',
      notificationId: 'test-123',
      clickToken: 'test-token'
    });
  };

  return (
    <Button 
      onClick={handleTestBanner}
      variant="outline"
      className="fixed bottom-4 right-4 z-50"
    >
      Test Banner
    </Button>
  );
};