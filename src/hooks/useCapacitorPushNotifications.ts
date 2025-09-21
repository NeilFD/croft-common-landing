import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useCapacitorPushNotifications = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not a native platform, skipping push notifications setup');
      return;
    }

    const initializePushNotifications = async () => {
      try {
        console.log('📱 Initializing native push notifications...');
        console.log('📱 Platform:', Capacitor.getPlatform());

        // Request permission first
        const permResult = await PushNotifications.requestPermissions();
        console.log('📱 Push permission result:', permResult);

        if (permResult.receive === 'granted') {
          console.log('📱 Push notifications permission granted, registering...');
          await PushNotifications.register();
        } else {
          console.log('📱 Push notifications permission denied');
          toast({
            title: "Push Notifications",
            description: "Permission denied. You can enable them in your device settings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('📱 Error initializing push notifications:', error);
        toast({
          title: "Push Notifications Error",
          description: "Failed to initialize push notifications",
          variant: "destructive"
        });
      }
    };

    const setupListeners = async () => {
      // Listen for successful registration
      const registrationListener = await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('📱 Push registration success');
        console.log('📱 Token value:', token.value);
        console.log('📱 Platform:', Capacitor.getPlatform());
        
        try {
          const platform = Capacitor.getPlatform();
          let endpoint: string;
          let requestBody: any = {
            platform: platform,
            user_agent: navigator.userAgent || 'Unknown'
          };

          // Format token based on platform
          if (platform === 'ios') {
            // iOS uses APNs tokens
            endpoint = `ios-token:${token.value}`;
            requestBody.endpoint = endpoint;
            console.log('📱 Saving iOS APNs token');
          } else if (platform === 'android') {
            // Android uses FCM tokens  
            endpoint = `android-token:${token.value}`;
            requestBody.endpoint = endpoint;
            console.log('📱 Saving Android FCM token');
          } else {
            console.error('📱 Unknown platform:', platform);
            return;
          }

          console.log('📱 Calling save-push-subscription with:', {
            endpoint: requestBody.endpoint,
            platform: requestBody.platform
          });

          const { data, error } = await supabase.functions.invoke('save-push-subscription', {
            body: requestBody
          });
          
          if (error) {
            console.error('📱 Failed to save push token:', error);
            toast({
              title: "Push Setup Error",
              description: "Failed to save push notification token",
              variant: "destructive"
            });
          } else {
            console.log('📱 Push token saved successfully:', data);
            toast({
              title: "Push Notifications",
              description: "Push notifications enabled successfully!",
            });
          }
        } catch (error) {
          console.error('📱 Error saving push token:', error);
          toast({
            title: "Push Setup Error", 
            description: "Failed to save push notification token",
            variant: "destructive"
          });
        }
      });

      // Listen for registration errors
      const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('📱 Push registration error:', error);
        toast({
          title: "Push Registration Error",
          description: "Failed to register for push notifications",
          variant: "destructive"
        });
      });

      // Listen for incoming push notifications when app is in foreground
      const notificationReceivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📱 Push notification received in foreground:', notification);
        
        // Show a toast for foreground notifications
        toast({
          title: notification.title || "New Notification",
          description: notification.body || "You have a new notification",
        });
      });

      // Listen for push notification tap/action
      const notificationActionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('📱 Push notification action performed:', notification);
        
        // Handle deep linking if URL is provided
        const data = notification.notification.data;
        if (data?.url) {
          console.log('📱 Navigating to:', data.url);
          // You could use React Router here to navigate
          window.location.href = data.url;
        }
      });

      // Initialize push notifications after listeners are set up
      await initializePushNotifications();

      // Return cleanup function
      return () => {
        console.log('📱 Cleaning up push notification listeners');
        registrationListener.remove();
        registrationErrorListener.remove();
        notificationReceivedListener.remove();
        notificationActionListener.remove();
      };
    };

    // Set up listeners and store cleanup function
    let cleanup: (() => void) | undefined;
    setupListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    }).catch((error) => {
      console.error('📱 Error setting up push notification listeners:', error);
    });

    // Return cleanup function for useEffect
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);
};