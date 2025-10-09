import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { mobileLog, DEBUG_SESSION_ID } from '@/lib/mobileDebug';

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

    const platform = Capacitor.getPlatform();
    const { data: { user } } = await supabase.auth.getUser();
    
    mobileLog('native:init', { platform, user_id: user?.id });

    console.log('📱 Initialising listeners...');
    
    const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

    await PushNotifications.addListener('registration', async (token) => {
      console.log('📱 ✅ Token:', token.value.substring(0, 20) + '...');
      
      const tokenPrefix = token.value.substring(0, 12);
      mobileLog('native:token', { token_prefix: tokenPrefix, platform });
      
      lastToken = token.value;
      lastError = null;
      tokenCallbacks.forEach(cb => cb(token.value));
      
      try {
        const platform = Capacitor.getPlatform();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('📱 No user - cannot save token');
          mobileLog('native:token_save_error', { reason: 'no_user' }, 'No authenticated user');
          return;
        }
        
        console.log(`📱 Saving ${platform} token...`);
        mobileLog('native:token_save_start', { platform, user_id: user.id });
        
        const { error } = await supabase.functions.invoke('save-push-subscription', {
          body: {
            endpoint: `${platform}-token:${token.value}`,
            platform,
            session_id: DEBUG_SESSION_ID
          }
        });
        
        if (error) {
          console.error('📱 Save error:', error);
          mobileLog('native:token_save_error', { platform }, error.message || String(error));
        } else {
          console.log('📱 ✅ Token saved');
          mobileLog('native:token_save_ok', { platform });
        }
      } catch (error) {
        console.error('📱 Exception:', error);
        mobileLog('native:token_save_exception', null, error as Error);
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('📱 ❌ Error:', error);
      
      const errorMessage = error.error || String(error);
      mobileLog('native:registration_error', { error: errorMessage }, errorMessage);
      
      lastError = errorMessage;
      lastToken = null;
      errorCallbacks.forEach(cb => cb(errorMessage));
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push received:', notification);
      mobileLog('native:notification_received', {
        id: notification.id,
        title: notification.title?.substring(0, 50),
        body: notification.body?.substring(0, 100)
      });
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Push action:', notification);
      mobileLog('native:notification_action', { 
        actionId: notification.actionId,
        notificationId: notification.notification.id 
      });
    });

    console.log('📱 ✅ Listeners ready');
    mobileLog('native:listeners_ready', { platform });
  },

  /**
   * Explicit registration - call from UI only
   */
  async register(): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      mobileLog('native:register_skip', { reason: 'not_native' });
      return { success: false, error: 'Not native' };
    }

    if (isRegistering) {
      console.log('📱 Already registering...');
      mobileLog('native:register_skip', { reason: 'already_registering' });
      return { success: false, error: 'In progress' };
    }

    if (hasRegistered) {
      console.log('📱 Already registered');
      mobileLog('native:register_skip', { reason: 'already_registered' });
      return { success: true };
    }

    isRegistering = true;
    console.log('📱 Requesting permission...');
    mobileLog('native:request_permissions_start', { platform: Capacitor.getPlatform() });

    try {
      const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

      const permResult = await PushNotifications.requestPermissions();
      console.log('📱 Permission:', permResult.receive);
      mobileLog('native:permission_result', { receive: permResult.receive });

      if (permResult.receive !== 'granted') {
        isRegistering = false;
        mobileLog('native:permission_denied', { receive: permResult.receive }, 'Permission denied');
        return { success: false, error: 'Permission denied' };
      }

      console.log('📱 Calling register()...');
      mobileLog('native:register_called', { platform: Capacitor.getPlatform() });
      await PushNotifications.register();
      
      hasRegistered = true;
      isRegistering = false;
      
      console.log('📱 ✅ Waiting for token...');
      mobileLog('native:register_ok', { platform: Capacitor.getPlatform() });
      return { success: true };
      
    } catch (error) {
      isRegistering = false;
      console.error('📱 Failed:', error);
      mobileLog('native:register_error', null, error as Error);
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
    const perms = await PushNotifications.checkPermissions();
    mobileLog('native:check_permissions', { receive: perms.receive });
    return perms;
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
