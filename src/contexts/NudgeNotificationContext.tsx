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

  // Initialize from storage on mount
  React.useEffect(() => {
    const initializeFromStorage = async () => {
      console.log('🎯 NUDGE CONTEXT: Initializing from storage...');
      
      // Check sessionStorage first
      const storedUrl = sessionStorage.getItem('nudge_url');
      const storedClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (storedUrl) {
        console.log('🎯 NUDGE CONTEXT: Found URL in sessionStorage:', storedUrl);
        setNudgeUrlState(storedUrl);
        setNudgeClicked(storedClicked);
        return;
      }

      // Check IndexedDB as fallback
      try {
        const request = indexedDB.open('nudge-storage', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (db.objectStoreNames.contains('nudge')) {
            const transaction = db.transaction(['nudge'], 'readonly');
            const store = transaction.objectStore('nudge');
            const getRequest = store.get('nudge_url');
            
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                console.log('🎯 NUDGE CONTEXT: Found URL in IndexedDB:', getRequest.result);
                setNudgeUrlState(getRequest.result);
                // Also sync to sessionStorage
                sessionStorage.setItem('nudge_url', getRequest.result);
              }
            };
          }
          db.close();
        };
      } catch (error) {
        console.log('🎯 NUDGE CONTEXT: IndexedDB check failed:', error);
      }
    };

    initializeFromStorage();
  }, []);

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

  const showNudgeButton = nudgeUrl !== null;

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