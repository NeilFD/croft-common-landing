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

  const checkStorage = async () => {
    console.log('🧪 DEBUG: Checking all storage');
    
    const results = [];
    
    // Check sessionStorage
    const sessionNudge = sessionStorage.getItem('nudge_url');
    const sessionClicked = sessionStorage.getItem('nudge_clicked');
    const sessionInit = sessionStorage.getItem('app_initialized');
    
    results.push(`📱 Session Storage:`);
    results.push(`  nudge_url: ${sessionNudge}`);
    results.push(`  nudge_clicked: ${sessionClicked}`);
    results.push(`  app_initialized: ${sessionInit}`);
    
    console.log('SessionStorage nudge_url:', sessionNudge);
    console.log('SessionStorage nudge_clicked:', sessionClicked);
    console.log('SessionStorage app_initialized:', sessionInit);
    
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.active) {
          const swUrl = registration.active.scriptURL;
          const isMobile = swUrl.includes('sw-mobile.js');
          const isMain = swUrl.includes('sw.js') && !swUrl.includes('sw-mobile.js');
          
          results.push(`\n🔧 Active Service Worker:`);
          results.push(`  URL: ${swUrl}`);
          
          if (isMobile) {
            results.push(`  Status: ✅ Mobile SW with NUDGE support`);
            console.log('✅ MOBILE SERVICE WORKER WITH NUDGE - SHOULD WORK!');
          } else if (isMain) {
            results.push(`  Status: ✅ Main SW with NUDGE support`);
            console.log('✅ Main service worker - NUDGE should work');
          } else {
            results.push(`  Status: ❓ Unknown service worker`);
            console.log('❓ Unknown service worker:', swUrl);
          }
          
          console.log('🔍 Active service worker:', swUrl);
        } else {
          results.push(`\n❌ No active service worker`);
          console.log('❌ No active service worker');
        }
      } catch (error) {
        results.push(`\n❌ SW check failed: ${error}`);
        console.error('SW check failed:', error);
      }
    } else {
      results.push(`\n❌ Service Worker not supported`);
    }
    
    // Check IndexedDB
    try {
      const request = indexedDB.open('nudge-storage', 1);
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains('nudge')) {
          const transaction = db.transaction(['nudge'], 'readonly');
          const store = transaction.objectStore('nudge');
          
          store.get('current').onsuccess = (e) => {
            const currentResult = (e.target as IDBRequest).result;
            results.push(`\n💾 IndexedDB Current: ${JSON.stringify(currentResult)}`);
            console.log('🧪 DEBUG: IndexedDB current:', currentResult);
          };
          
          store.get('delivery_pending').onsuccess = (e) => {
            const pendingResult = (e.target as IDBRequest).result;
            results.push(`\n💾 IndexedDB Pending: ${JSON.stringify(pendingResult)}`);
            console.log('🧪 DEBUG: IndexedDB pending:', pendingResult);
          };
        } else {
          results.push(`\n💾 IndexedDB: No 'nudge' object store found`);
        }
      };
      request.onerror = () => {
        results.push(`\n❌ IndexedDB access failed: ${request.error}`);
        console.error('IndexedDB access failed:', request.error);
      };
    } catch (error) {
      results.push(`\n❌ IndexedDB error: ${error}`);
      console.error('IndexedDB error:', error);
    }

    // Show results in UI after a brief delay to allow async operations
    setTimeout(() => {
      alert(results.join('\n'));
    }, 800);
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