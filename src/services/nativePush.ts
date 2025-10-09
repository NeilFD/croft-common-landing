import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

let isRegistering = false;
let hasRegistered = false;

/**
 * Centralized Native Push Notification Service
 * Single source of truth for iOS/Android push registration
 */
export const nativePush = {
  /**
   * Initialize push notifications - sets up listeners only
   * Does NOT automatically register - that must be explicit
   */
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not a native platform, skipping native push initialization');
      return;
    }

    console.log('📱 Initializing native push service...');
    
    const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

    // Set up listeners (once)
    await PushNotifications.addListener('registration', async (token) => {
      console.log('📱 ✅ Push token received:', token.value.substring(0, 20) + '...');
      
      try {
        const platform = Capacitor.getPlatform();
        const tokenPrefix = platform === 'ios' ? 'ios-token:' : 'android-token:';
        
        console.log(`📱 Saving ${platform} token to Supabase...`);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('📱 No authenticated user - cannot save token');
          return;
        }
        
        const { data, error } = await supabase.functions.invoke('save-push-subscription', {
          body: {
            endpoint: `${tokenPrefix}${token.value}`,
            platform: platform
          }
        });
        
        if (error) {
          console.error('📱 Failed to save token:', error);
        } else {
          console.log('📱 ✅ Token saved successfully:', data);
        }
      } catch (error) {
        console.error('📱 Exception saving token:', error);
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('📱 ❌ Registration error:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push notification received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Push notification action performed:', notification);
    });

    console.log('📱 ✅ Native push listeners initialized');
  },

  /**
   * Request permission and register for push notifications
   * Call this explicitly when user wants to enable push
   */
  async register(): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Not a native platform' };
    }

    if (isRegistering) {
      console.log('📱 Registration already in progress...');
      return { success: false, error: 'Registration in progress' };
    }

    if (hasRegistered) {
      console.log('📱 Already registered this session');
      return { success: true };
    }

    isRegistering = true;
    console.log('📱 Starting push registration...');

    try {
      const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      console.log('📱 Permission result:', permResult.receive);

      if (permResult.receive !== 'granted') {
        isRegistering = false;
        return { success: false, error: 'Permission denied' };
      }

      // Register with APNs/FCM
      console.log('📱 Calling PushNotifications.register()...');
      await PushNotifications.register();
      
      hasRegistered = true;
      isRegistering = false;
      
      console.log('📱 ✅ Registration initiated - waiting for token...');
      return { success: true };
      
    } catch (error) {
      isRegistering = false;
      console.error('📱 Registration failed:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Check current permission status
   */
  async checkPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { receive: 'prompt' };
    }

    const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');
    return await PushNotifications.checkPermissions();
  }
};
