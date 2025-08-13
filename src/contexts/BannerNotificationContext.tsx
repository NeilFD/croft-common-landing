import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BannerNotificationData {
  title: string;
  body: string;
  bannerMessage?: string;
  url?: string;
  icon?: string;
  notificationId: string;
  clickToken?: string;
}

interface BannerNotificationContextType {
  currentBanner: BannerNotificationData | null;
  showBanner: (data: BannerNotificationData) => void;
  dismissBanner: () => void;
}

const BannerNotificationContext = createContext<BannerNotificationContextType | undefined>(undefined);

export const useBannerNotification = () => {
  const context = useContext(BannerNotificationContext);
  if (!context) {
    throw new Error('useBannerNotification must be used within a BannerNotificationProvider');
  }
  return context;
};

interface BannerNotificationProviderProps {
  children: ReactNode;
}

export const BannerNotificationProvider: React.FC<BannerNotificationProviderProps> = ({ children }) => {
  const [currentBanner, setCurrentBanner] = useState<BannerNotificationData | null>(null);

  const showBanner = (data: BannerNotificationData) => {
    console.log('🔔 Banner Context: Setting banner data:', data);
    setCurrentBanner(data);
  };

  const dismissBanner = () => {
    setCurrentBanner(null);
  };

  const value = {
    currentBanner,
    showBanner,
    dismissBanner,
  };

  return (
    <BannerNotificationContext.Provider value={value}>
      {children}
    </BannerNotificationContext.Provider>
  );
};