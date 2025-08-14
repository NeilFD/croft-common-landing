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
      
      // Check sessionStorage first
      const storedUrl = sessionStorage.getItem('nudge_url');
      const storedClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (storedUrl) {
        console.log('🎯 NUDGE CONTEXT: Found URL in sessionStorage:', storedUrl);
        setNudgeUrlState(storedUrl);
        setNudgeClicked(storedClicked);
        return;
      }

      // Check IndexedDB as fallback with proper initialization
      try {
        const request = indexedDB.open('nudge-storage', 2);
        
        request.onupgradeneeded = (event) => {
          console.log('🎯 NUDGE CONTEXT: Creating/upgrading nudge database');
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('nudge')) {
            db.createObjectStore('nudge');
            console.log('🎯 NUDGE CONTEXT: Created nudge object store');
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (db.objectStoreNames.contains('nudge')) {
            const transaction = db.transaction(['nudge'], 'readonly');
            const store = transaction.objectStore('nudge');
            
            // Check multiple keys that service worker might use
            const checkKeys = ['current', 'delivery_pending', 'nudge_url'];
            let foundUrl = false;
            
            const tryNextKey = (index: number) => {
              if (index >= checkKeys.length || foundUrl) {
                db.close();
                return;
              }
              
              const getRequest = store.get(checkKeys[index]);
              getRequest.onsuccess = () => {
                if (getRequest.result && !foundUrl) {
                  const result = getRequest.result;
                  
                  // Validate that this is a real URL and not an undefined object
                  let url = null;
                  if (typeof result === 'string') {
                    url = result;
                  } else if (result.url && result.url !== 'undefined' && 
                           !(result._type === 'undefined' && result.value === 'undefined')) {
                    url = result.url;
                  }
                  
                  if (url) {
                    console.log('🎯 NUDGE CONTEXT: Found URL in IndexedDB key', checkKeys[index], ':', url);
                    setNudgeUrlState(url);
                    sessionStorage.setItem('nudge_url', url);
                    foundUrl = true;
                    db.close();
                    return;
                  }
                }
                tryNextKey(index + 1);
              };
              getRequest.onerror = () => tryNextKey(index + 1);
            };
            
            tryNextKey(0);
          } else {
            console.log('🎯 NUDGE CONTEXT: No nudge store found');
            db.close();
          }
        };
        
        request.onerror = () => {
          console.log('🎯 NUDGE CONTEXT: IndexedDB open failed:', request.error);
        };
      } catch (error) {
        console.log('🎯 NUDGE CONTEXT: IndexedDB check failed:', error);
      }
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