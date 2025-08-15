import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NudgeNotificationContextType {
  nudgeUrl: string | null;
  showNudgeButton: boolean;
  nudgeClicked: boolean;
  setNudgeUrl: (url: string | null) => void;
  markNudgeClicked: () => void;
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
  const [nudgeClicked, setNudgeClicked] = useState<boolean>(false);

  // Initialize from storage on mount and set up real-time sync
  React.useEffect(() => {
    const initializeFromStorage = async () => {
      console.log('🎯 NUDGE CONTEXT: Initializing from storage...');
      
      // Check for existing nudge URLs from sessionStorage first (fast check)
      const storedUrl = sessionStorage.getItem('nudge_url');
      const storedClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (storedUrl && !storedClicked) {
        console.log('🎯 NUDGE CONTEXT: Found existing URL in sessionStorage:', storedUrl);
        setNudgeUrlState(storedUrl);
        setNudgeClicked(false);
      }
      
      // Mark app as initialized for this session
      sessionStorage.setItem('app_initialized', 'true');
      console.log('🎯 NUDGE CONTEXT: App initialized - checking for existing notifications');
    };

    initializeFromStorage();

    // Set up storage event listener for sessionStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nudge_url') {
        console.log('🎯 NUDGE CONTEXT: Storage changed, nudge_url:', e.newValue);
        if (e.newValue && e.newValue !== nudgeUrl) {
          setNudgeUrlState(e.newValue);
          setNudgeClicked(false);
        } else if (!e.newValue) {
          setNudgeUrlState(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Set up periodic sync when app is visible and context is null but storage has value
    const syncInterval = setInterval(async () => {
      if (!document.hidden && nudgeUrl === null) {
        const storedUrl = sessionStorage.getItem('nudge_url');
        if (storedUrl) {
          console.log('🎯 NUDGE CONTEXT: Sync detected stored URL when context was null:', storedUrl);
          setNudgeUrlState(storedUrl);
          setNudgeClicked(sessionStorage.getItem('nudge_clicked') === 'true');
        }
      }
    }, 2000);

    // Set up focus/visibility recovery
    const handleFocusRecovery = async () => {
      const storedUrl = sessionStorage.getItem('nudge_url');
      if (storedUrl && storedUrl !== nudgeUrl) {
        console.log('🎯 NUDGE CONTEXT: Focus recovery found URL:', storedUrl);
        setNudgeUrlState(storedUrl);
        setNudgeClicked(sessionStorage.getItem('nudge_clicked') === 'true');
      }
    };

    window.addEventListener('focus', handleFocusRecovery);
    document.addEventListener('visibilitychange', handleFocusRecovery);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocusRecovery);
      document.removeEventListener('visibilitychange', handleFocusRecovery);
      clearInterval(syncInterval);
    };
  }, [nudgeUrl]);

  const setNudgeUrl = (url: string | null) => {
    console.log('🎯 NUDGE CONTEXT: Setting URL:', url);
    setNudgeUrlState(url);
    setNudgeClicked(false); // Reset clicked state when new URL is set
    if (url) {
      sessionStorage.setItem('nudge_url', url);
      sessionStorage.removeItem('nudge_clicked');
    } else {
      sessionStorage.removeItem('nudge_url');
      sessionStorage.removeItem('nudge_clicked');
    }
  };

  const markNudgeClicked = () => {
    console.log('🎯 NUDGE CONTEXT: Marking as clicked');
    setNudgeClicked(true);
    sessionStorage.setItem('nudge_clicked', 'true');
  };

  const clearNudge = () => {
    console.log('🎯 NUDGE CONTEXT: Clearing nudge');
    setNudgeUrl(null);
  };

  const showNudgeButton = nudgeUrl !== null && !nudgeClicked;
  console.log('🎯 NUDGE CONTEXT: showNudgeButton calculation -', { 
    nudgeUrl, 
    nudgeUrlType: typeof nudgeUrl, 
    nudgeClicked,
    showNudgeButton,
    nudgeUrlValue: JSON.stringify(nudgeUrl)
  });

  const value = {
    nudgeUrl,
    showNudgeButton,
    nudgeClicked,
    setNudgeUrl,
    markNudgeClicked,
    clearNudge,
  };

  return (
    <NudgeNotificationContext.Provider value={value}>
      {children}
    </NudgeNotificationContext.Provider>
  );
};