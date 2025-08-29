
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isStandalone, isIosSafari } from './registerPWA';
import { getStoredUserHandle } from '@/lib/biometricAuth';

const VAPID_PUBLIC_KEY = 'BNJzdn55lXCAzsC07XdmDcsJeRb9sN-tLfGkrP5uAFNEt-LyEsEhVoMjD0CtHiBZjsyrTdTh19E2cnRUB5N9Mww';
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Retry utility for iOS Safari
async function retryWithDelay<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`🔔 Retry ${i + 1}/${maxRetries} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('All retries failed');
}

// Enhanced logging utility
function logStep(step: string, data?: any) {
  console.log(`🔔 [EnableNotifications] ${step}`, data || '');
}

export async function enableNotifications(reg: ServiceWorkerRegistration): Promise<boolean> {
  logStep('🚀 Starting notification enablement process');
  
  if (!('Notification' in window)) {
    logStep('❌ Notification API not supported');
    return false;
  }

  if (!('PushManager' in window)) {
    logStep('❌ Push manager not supported');
    return false;
  }

  // Enhanced debugging for iOS
  logStep('🔍 iOS NOTIFICATION DEBUG', {
    permission: Notification.permission,
    userAgent: navigator.userAgent.substring(0, 100),
    isStandalone: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone === true,
    pushManagerExists: !!reg.pushManager,
    serviceWorkerReady: !!reg.active
  });

  try {
    let permission = Notification.permission;
    const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'web');
    const isIos = platform === 'ios';
    
    logStep('📋 Initial state', { 
      permission, 
      platform, 
      isStandalone, 
      isIos: isIosSafari(),
      userAgent: navigator.userAgent.slice(0, 100) + '...'
    });

    // Track prompt shown
    logStep('📊 Tracking prompt_shown event');
    try {
      await supabase.functions.invoke('track-push-optin', {
        body: { event: 'prompt_shown', platform, user_agent: navigator.userAgent },
      });
      logStep('✅ Successfully tracked prompt_shown');
    } catch (error) {
      console.warn('⚠️ Failed to track prompt_shown:', error);
    }

    // Handle permission request with iOS-specific timing
    if (permission === 'default') {
      logStep('🔑 Requesting permission from user');
      
      if (isIos) {
        // iOS Safari needs more time to process permission requests
        logStep('🍎 Applying iOS-specific permission handling');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      try {
        permission = await Notification.requestPermission();
        logStep('📝 Permission request result', { permission });
        
        // Track grant/deny result
        const event = permission === 'granted' ? 'granted' : 'denied';
        logStep(`📊 Tracking ${event} event`);
        
        try {
          await supabase.functions.invoke('track-push-optin', {
            body: { event, platform, user_agent: navigator.userAgent },
          });
          logStep(`✅ Successfully tracked ${event}`);
        } catch (error) {
          console.warn(`⚠️ Failed to track ${event}:`, error);
        }
      } catch (error) {
        logStep('❌ Permission request failed', error);
        return false;
      }
    } else {
      logStep('ℹ️ Permission already set', { permission });
    }

    if (permission !== 'granted') {
      logStep('❌ Permission not granted', { permission });
      
      let description = permission === 'denied'
        ? 'You can enable notifications in your browser settings.'
        : 'Please try again, or enable notifications in your browser settings.';

      if (isIosSafari()) {
        description = !isStandalone
          ? 'On iPhone, add the app to your Home Screen first (Share → Add to Home Screen). Open it, then enable notifications.'
          : 'On iPhone, go to Settings → Notifications → Croft Common → Allow Notifications. Then force-quit and reopen the app.';
      }

      logStep('💡 User guidance', { description });
      return false;
    }

    logStep('✅ Permission granted, proceeding with subscription');

    // Enhanced subscription creation with retry for iOS
    let sub: PushSubscription | null = null;
    
    try {
      // First, check for existing subscription
      logStep('🔍 Checking for existing subscription');
      sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        logStep('♻️ Found existing subscription, reusing');
      } else {
        logStep('🆕 No existing subscription, creating new one');
        
        // For iOS, we need to be more careful about subscription creation
        const subscribeFunction = async () => {
          logStep('📡 Attempting push subscription');
          return await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        };

        if (isIos) {
          logStep('🍎 Using iOS-specific subscription retry logic');
          sub = await retryWithDelay(subscribeFunction, 3, 1500);
        } else {
          sub = await subscribeFunction();
        }
        
        logStep('✅ Successfully created subscription');
      }
    } catch (error) {
      logStep('❌ Failed to create/get subscription', error);
      return false;
    }

    // Extract subscription data
    const raw = sub.toJSON() as any;
    const endpoint = raw.endpoint;
    const p256dh = raw.keys?.p256dh;
    const auth = raw.keys?.auth;

    logStep('📋 Subscription data extracted', { 
      endpoint: endpoint?.slice(0, 50) + '...', 
      hasP256dh: !!p256dh, 
      hasAuth: !!auth 
    });

    if (!endpoint || !p256dh || !auth) {
      logStep('❌ Invalid subscription data', { endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth });
      return false;
    }

    // Enhanced user ID resolution with retry
    logStep('🔍 Resolving user ID from WebAuthn');
    let userId: string | null = null;
    const userHandle = getStoredUserHandle();
    
    if (userHandle) {
      logStep('🔑 Found WebAuthn user handle, resolving to user ID');
      
      const resolveUserId = async () => {
        const { data: userLink, error } = await supabase
          .from('webauthn_user_links')
          .select('user_id')
          .eq('user_handle', userHandle)
          .single();
        
        if (error) throw error;
        return userLink?.user_id ?? null;
      };

      try {
        if (isIos) {
          logStep('🍎 Using iOS-specific user ID resolution retry');
          userId = await retryWithDelay(resolveUserId, 2, 1000);
        } else {
          userId = await resolveUserId();
        }
        
        logStep('✅ Successfully resolved user ID', { userId: userId ? 'found' : 'null' });
      } catch (error) {
        logStep('⚠️ Could not resolve WebAuthn user handle to user_id', error);
        // Continue without user_id - the backend can handle this
      }
    } else {
      logStep('ℹ️ No WebAuthn user handle found');
    }

    // Save subscription with enhanced error handling
    logStep('💾 Saving subscription to backend');
    
    const saveSubscription = async () => {
      const { data, error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          platform,
          user_id: userId,
        },
      });
      
      if (error) throw error;
      return data;
    };

    let saveData;
    try {
      if (isIos) {
        logStep('🍎 Using iOS-specific save retry logic');
        saveData = await retryWithDelay(saveSubscription, 2, 1000);
      } else {
        saveData = await saveSubscription();
      }
      
      logStep('✅ Successfully saved subscription', { subscriptionId: saveData?.subscription_id });
    } catch (error) {
      logStep('❌ Failed to save subscription', error);
      return false;
    }

    // Track successful subscribe
    logStep('📊 Tracking subscribed event');
    try {
      await supabase.functions.invoke('track-push-optin', {
        body: {
          event: 'subscribed',
          subscription_id: saveData?.subscription_id,
          platform,
          user_agent: navigator.userAgent,
          endpoint,
        },
      });
      logStep('✅ Successfully tracked subscribed event');
    } catch (error) {
      console.warn('⚠️ Failed to track subscribed event:', error);
      // Don't fail the whole process for tracking errors
    }

    logStep('🎉 Notification enablement completed successfully');
    return true;
    
  } catch (e) {
    logStep('💥 Fatal error in enableNotifications', e);
    
    let description = 'Please try again later.';
    if (isIosSafari()) {
      description = !isStandalone
        ? 'Install the app to your Home Screen first, then try again.'
        : 'If you just changed Settings, force-quit and reopen the app, then try again.';
    }
    logStep('💡 Error guidance for user', { description });
    return false;
  }
}

export async function resetNotifications(reg: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const existing = await reg.pushManager.getSubscription();
    let endpoint: string | null = null;
    if (existing) {
      const raw = existing.toJSON() as any;
      endpoint = raw.endpoint ?? null;
      await existing.unsubscribe().catch(() => {});
    }
  if (endpoint) {
    await supabase.functions.invoke('delete-push-subscription', { body: { endpoint } });
    // Track unsubscribe
    void supabase.functions.invoke('track-push-optin', {
      body: { event: 'unsubscribed', endpoint, platform: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'web'), user_agent: navigator.userAgent },
    });
  }
  if (import.meta.env.DEV) console.log('[Notifications] Reset complete, re-enabling…');
  return await enableNotifications(reg);
  } catch (e) {
    console.error('Reset notifications error:', e);
    return false;
  }
}
