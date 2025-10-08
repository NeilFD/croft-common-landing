import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const useCapacitorPushNotifications = () => {
  useEffect(() => {
    // Only run on native iOS/Android platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not a native platform, skipping Capacitor push notifications');
      return;
    }

    console.log('📱 Setting up push notification listeners...');
    let registrationReceived = false;
    let listeners: any[] = [];
    let retryAttempted = false;

    const setupListeners = async () => {
      // Dynamic import only on native platforms
      const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');
      // CRITICAL: Set up all listeners BEFORE calling register()
      // This ensures we don't miss any events due to race conditions
      
      // Listen for registration success
      const registrationListener = await PushNotifications.addListener('registration', async (token) => {
      registrationReceived = true;
      console.log('📱 ✅ Registration event fired!');
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
      listeners.push(registrationListener);
      console.log('📱 ✅ Registration listener attached');

      // Listen for registration error
      const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('📱 ❌ Push registration error:', error);
        console.error('📱 This often indicates missing entitlements or provisioning issues');
        console.error('📱 Check: 1) Push Notifications capability enabled, 2) Proper provisioning profile, 3) aps-environment entitlement');
      });
      listeners.push(registrationErrorListener);
      console.log('📱 ✅ Registration error listener attached');

      // Listen for push notifications
      const notificationListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📱 Push notification received:', notification);
      });
      listeners.push(notificationListener);
      console.log('📱 ✅ Push notification listener attached');

      // Listen for notification tap
      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('📱 Push notification action performed:', notification);
      });
      listeners.push(actionListener);
      console.log('📱 ✅ Notification action listener attached');

      const initializePushNotifications = async () => {
        try {
          console.log('📱 Initializing push notifications...');

          // Request permission
          const permResult = await PushNotifications.requestPermissions();
          console.log('📱 Push permission result:', permResult);

          if (permResult.receive === 'granted') {
            // Register for push notifications
            console.log('📱 Calling PushNotifications.register()...');
            await PushNotifications.register();
            console.log('📱 Push notifications registered');
            
            // ENHANCED: Idempotent retry mechanism after 8 seconds if no event
            setTimeout(() => {
              if (!registrationReceived && !retryAttempted) {
                retryAttempted = true;
                console.warn('📱 ⚠️ No registration event after 8s, attempting idempotent retry...');
                PushNotifications.register().then(() => {
                  console.log('📱 Retry register() called');
                }).catch(err => {
                  console.error('📱 Retry register() failed:', err);
                });
              }
            }, 8000);
            
            // EXTENDED: Check at 20 seconds instead of 5
            setTimeout(() => {
              if (!registrationReceived) {
                console.warn('📱 ⚠️ Registration event did NOT fire within 20 seconds!');
                console.warn('📱 This indicates an iOS/Capacitor race condition');
                console.warn('📱 The device token may have been generated but not captured');
                console.warn('📱 Possible causes:');
                console.warn('📱   1. Missing aps-environment entitlement');
                console.warn('📱   2. Provisioning profile issue');
                console.warn('📱   3. Capacitor plugin timing issue');
                console.warn('📱 Try using the manual "Register for Push" button in /management diagnostics');
              } else {
                console.log('📱 ✅ Registration event was successfully received');
              }
            }, 20000);
          } else {
            console.log('📱 Push notifications permission denied');
          }
        } catch (error) {
          console.error('📱 Error initializing push notifications:', error);
        }
      };

      // Small delay to ensure all listeners are fully attached
      setTimeout(() => {
        console.log('📱 All listeners attached, starting initialization...');
        initializePushNotifications();
      }, 100);
    };

    setupListeners();

    return () => {
      console.log('📱 Cleaning up push notification listeners...');
      listeners.forEach(listener => listener.remove());
    };
  }, []);
};