import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export const useCapacitorPushNotifications = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const initializePushNotifications = async () => {
      try {
        console.log('📱 Initializing push notifications...');

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        console.log('📱 Push permission result:', permResult);

        if (permResult.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
          console.log('📱 Push notifications registered');
        } else {
          console.log('📱 Push notifications permission denied');
        }
      } catch (error) {
        console.error('📱 Error initializing push notifications:', error);
      }
    };

    // Listen for registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('📱 Push registration success, token:', token.value);
      
      try {
        const { error } = await supabase.functions.invoke('save-push-subscription', {
          body: {
            endpoint: `ios-token:${token.value}`,
            platform: 'ios'
          }
        });
        
        if (error) {
          console.error('📱 Failed to save iOS push token:', error);
        } else {
          console.log('📱 iOS push token saved successfully');
        }
      } catch (error) {
        console.error('📱 Error saving iOS push token:', error);
      }
    });

    // Listen for registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('📱 Push registration error:', error);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push notification received:', notification);
    });

    // Listen for notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Push notification action performed:', notification);
    });

    // Initialize
    initializePushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
};