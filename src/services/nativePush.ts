import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

let isRegistering = false;
let hasRegistered = false;

// Event bus for token/error events
type TokenCallback = (token: string) => void;
type ErrorCallback = (error: string) => void;

let tokenCallbacks: TokenCallback[] = [];
let errorCallbacks: ErrorCallback[] = [];
let lastToken: string | null = null;
let lastError: string | null = null;

/**
 * Simplified Native Push Service
 * iOS/Android token registration with clear logging
 */
export const nativePush = {
  /**
   * Initialize push listeners only - no auto-registration
   */
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not native platform, skipping');
      return;
    }

    console.log('📱 Initialising listeners...');
    
    const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

    await PushNotifications.addListener('registration', async (token) => {
      console.log('📱 ✅ Token:', token.value.substring(0, 20) + '...');
      
      lastToken = token.value;
      lastError = null;
      tokenCallbacks.forEach(cb => cb(token.value));
      
      try {
        const platform = Capacitor.getPlatform();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('📱 No user - cannot save token');
          return;
        }
        
        console.log(`📱 Saving ${platform} token...`);
        
        const { error } = await supabase.functions.invoke('save-push-subscription', {
          body: {
            endpoint: `${platform}-token:${token.value}`,
            platform
          }
        });
        
        if (error) {
          console.error('📱 Save error:', error);
        } else {
          console.log('📱 ✅ Token saved');
        }
      } catch (error) {
        console.error('📱 Exception:', error);
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('📱 ❌ Error:', error);
      
      const errorMessage = error.error || String(error);
      lastError = errorMessage;
      lastToken = null;
      errorCallbacks.forEach(cb => cb(errorMessage));
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Push action:', notification);
    });

    console.log('📱 ✅ Listeners ready');
  },

  /**
   * Explicit registration - call from UI only
   */
  async register(): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Not native' };
    }

    if (isRegistering) {
      console.log('📱 Already registering...');
      return { success: false, error: 'In progress' };
    }

    if (hasRegistered) {
      console.log('📱 Already registered');
      return { success: true };
    }

    isRegistering = true;
    console.log('📱 Requesting permission...');

    try {
      const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

      const permResult = await PushNotifications.requestPermissions();
      console.log('📱 Permission:', permResult.receive);

      if (permResult.receive !== 'granted') {
        isRegistering = false;
        return { success: false, error: 'Permission denied' };
      }

      console.log('📱 Calling register()...');
      await PushNotifications.register();
      
      hasRegistered = true;
      isRegistering = false;
      
      console.log('📱 ✅ Waiting for token...');
      return { success: true };
      
    } catch (error) {
      isRegistering = false;
      console.error('📱 Failed:', error);
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
  },

  /**
   * Subscribe to token events
   * If a token was already received, the callback fires immediately
   */
  onToken(callback: TokenCallback) {
    tokenCallbacks.push(callback);
    
    // If we already have a token, fire immediately
    if (lastToken) {
      callback(lastToken);
    }
    
    // Return unsubscribe function
    return () => {
      tokenCallbacks = tokenCallbacks.filter(cb => cb !== callback);
    };
  },

  /**
   * Subscribe to error events
   * If an error was already received, the callback fires immediately
   */
  onError(callback: ErrorCallback) {
    errorCallbacks.push(callback);
    
    // If we already have an error, fire immediately
    if (lastError) {
      callback(lastError);
    }
    
    // Return unsubscribe function
    return () => {
      errorCallbacks = errorCallbacks.filter(cb => cb !== callback);
    };
  },

  /**
   * Clear cached events (useful for re-registration)
   */
  clearCache() {
    lastToken = null;
    lastError = null;
  }
};
