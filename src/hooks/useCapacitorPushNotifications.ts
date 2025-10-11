import { useEffect } from 'react';
import { nativePush } from '@/services/nativePush';

/**
 * Hook to initialize native push notifications
 * Sets up listeners only - does NOT automatically register
 * Registration must be triggered explicitly by user action
 */
export const useCapacitorPushNotifications = () => {
  useEffect(() => {
    console.log('📱 Initializing native push service...');
    nativePush.initialize('hook:useCapacitorPushNotifications');
  }, []);
};