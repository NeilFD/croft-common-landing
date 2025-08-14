import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NudgeNotificationContextType {
  nudgeUrl: string | null;
  showNudgeButton: boolean;
  setNudgeUrl: (url: string | null) => void;
  clearNudge: () => void;
}

const NudgeNotificationContext = createContext<NudgeNotificationContextType | undefined>(undefined);

export const useNudgeNotification = () => {
  const context = useContext(NudgeNotificationContext);
  if (context === undefined) {
    throw new Error('useNudgeNotification must be used within a NudgeNotificationProvider');
  }
  return context;
};

interface NudgeNotificationProviderProps {
  children: ReactNode;
}

export const NudgeNotificationProvider: React.FC<NudgeNotificationProviderProps> = ({ children }) => {
  const [nudgeUrl, setNudgeUrlState] = useState<string | null>(null);

  const setNudgeUrl = (url: string | null) => {
    setNudgeUrlState(url);
    if (url) {
      sessionStorage.setItem('nudge_url', url);
    } else {
      sessionStorage.removeItem('nudge_url');
    }
  };

  const clearNudge = () => {
    setNudgeUrl(null);
  };

  const showNudgeButton = nudgeUrl !== null;

  const value = {
    nudgeUrl,
    showNudgeButton,
    setNudgeUrl,
    clearNudge,
  };

  return (
    <NudgeNotificationContext.Provider value={value}>
      {children}
    </NudgeNotificationContext.Provider>
  );
};