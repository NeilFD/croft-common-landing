import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export const useCapacitorPushNotifications = () => {
  useEffect(() => {
    // Only run on native iOS/Android platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not a native platform, skipping Capacitor push notifications');
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
      console.log('📱 Native push registration success, token:', token.value);
      console.log('📱 Token details - First 20 chars:', token.value.substring(0, 20), '... Last 20 chars:', token.value.substring(token.value.length - 20));
      
      try {
        // Detect platform (iOS or Android)
        const platform = Capacitor.getPlatform();
        const tokenPrefix = platform === 'ios' ? 'ios-token:' : 'android-token:';
        console.log(`📱 Detected platform: ${platform}`);
        
        // Check auth state before calling edge function
        console.log('📱 Checking Supabase auth state...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('📱 Auth state:', { 
          userId: user?.id || 'null', 
          email: user?.email || 'none',
          authError: authError?.message || 'none'
        });
        
        console.log(`📱 Calling save-push-subscription edge function for ${platform}...`);
        console.log('📱 Request body:', { 
          endpoint: `${tokenPrefix}${token.value.substring(0, 30)}...`,
          platform: platform 
        });
        
        const { data, error } = await supabase.functions.invoke('save-push-subscription', {
          body: {
            endpoint: `${tokenPrefix}${token.value}`,
            platform: platform
          }
        });
        
        if (error) {
          console.error(`📱 Edge function returned error:`, {
            message: error.message,
            status: error.status,
            name: error.name,
            context: error.context,
            fullError: JSON.stringify(error, null, 2)
          });
        } else {
          console.log(`📱 Edge function success! Response:`, data);
          console.log(`📱 ${platform} push token saved successfully to database`);
        }
      } catch (error) {
        console.error('📱 Exception caught while saving native push token:');
        console.error('📱 Error type:', typeof error);
        console.error('📱 Error name:', (error as any)?.name);
        console.error('📱 Error message:', (error as any)?.message);
        console.error('📱 Error stack:', (error as any)?.stack);
        console.error('📱 Full error object:', JSON.stringify(error, null, 2));
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