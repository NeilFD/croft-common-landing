import React from 'react';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const NudgeDebugPanel = () => {
  const { nudgeUrl, showNudgeButton, nudgeClicked, setNudgeUrl, markNudgeClicked, clearNudge } = useNudgeNotification();

  const testNudge = () => {
    console.log('🧪 DEBUG: Testing NUDGE with test URL');
    setNudgeUrl('/test-nudge-url');
  };

  const testBroadcast = () => {
    console.log('🧪 DEBUG: Testing BroadcastChannel manually');
    try {
      const channel = new BroadcastChannel('nudge-notification');
      channel.postMessage({
        type: 'SHOW_NUDGE',
        url: '/test-broadcast-url',
        timestamp: Date.now(),
        delivery_method: 'manual_test'
      });
      console.log('🧪 DEBUG: Manual BroadcastChannel message sent');
      channel.close();
    } catch (error) {
      console.error('🧪 DEBUG: Manual BroadcastChannel failed:', error);
    }
  };

  const testWindowMessage = () => {
    console.log('🧪 DEBUG: Testing window message manually');
    window.postMessage({
      type: 'SHOW_NUDGE',
      url: '/test-window-url',
      timestamp: Date.now(),
      delivery_method: 'manual_window_test'
    }, window.location.origin);
  };

  const checkStorage = () => {
    console.log('🧪 DEBUG: Checking all storage');
    console.log('SessionStorage nudge_url:', sessionStorage.getItem('nudge_url'));
    console.log('SessionStorage nudge_clicked:', sessionStorage.getItem('nudge_clicked'));
    console.log('SessionStorage app_initialized:', sessionStorage.getItem('app_initialized'));
    
    // Check IndexedDB
    const request = indexedDB.open('nudge-storage', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (db.objectStoreNames.contains('nudge')) {
        const transaction = db.transaction(['nudge'], 'readonly');
        const store = transaction.objectStore('nudge');
        
        store.get('current').onsuccess = (e) => {
          console.log('🧪 DEBUG: IndexedDB current:', (e.target as IDBRequest).result);
        };
        
        store.get('delivery_pending').onsuccess = (e) => {
          console.log('🧪 DEBUG: IndexedDB pending:', (e.target as IDBRequest).result);
        };
      }
    };
  };

  return (
    <div className="fixed top-20 right-4 bg-background border rounded-lg p-4 z-50 shadow-lg max-w-sm">
      <h3 className="font-bold mb-2">NUDGE Debug Panel</h3>
      
      <div className="mb-2 text-xs">
        <div>URL: {nudgeUrl || 'null'}</div>
        <div>Show Button: {showNudgeButton ? 'true' : 'false'}</div>
        <div>Clicked: {nudgeClicked ? 'true' : 'false'}</div>
      </div>
      
      <div className="space-y-1">
        <button onClick={testNudge} className="block w-full bg-blue-500 text-white text-xs p-1 rounded">
          Test Direct Set
        </button>
        <button onClick={testBroadcast} className="block w-full bg-green-500 text-white text-xs p-1 rounded">
          Test Broadcast
        </button>
        <button onClick={testWindowMessage} className="block w-full bg-purple-500 text-white text-xs p-1 rounded">
          Test Window Message
        </button>
        <button onClick={checkStorage} className="block w-full bg-orange-500 text-white text-xs p-1 rounded">
          Check Storage
        </button>
        <button onClick={clearNudge} className="block w-full bg-red-500 text-white text-xs p-1 rounded">
          Clear Nudge
        </button>
      </div>
    </div>
  );
};