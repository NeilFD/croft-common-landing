import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isStandalone, isIosSafari } from './registerPWA';
import { getStoredUserHandle } from '@/lib/biometricAuth';
import { mobileLog, DEBUG_SESSION_ID } from '@/lib/mobileDebug';

// Re-export for backward compatibility
export { DEBUG_SESSION_ID };

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

// Enhanced logging utility - now uses mobile-friendly logging
function logStep(step: string, data?: any, showToast: boolean = false) {
  mobileLog(step, data, undefined, showToast);
}

export async function enableNotifications(reg: ServiceWorkerRegistration): Promise<boolean> {
  // Guard: Don't run web push on native platforms
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Native platform detected - web push disabled');
      return false;
    }
  } catch (e) {
    // Capacitor not available, continue with web push
  }

  logStep('🚀 Starting notification enablement process', { sessionId: DEBUG_SESSION_ID }, true);
  
  if (!('Notification' in window)) {
    await mobileLog('❌ Notification API not supported', null, 'Notification API not available', true);
    toast({ title: "Error", description: "Notifications are not supported in this browser", variant: "destructive" });
    return false;
  }

  if (!('PushManager' in window)) {
    await mobileLog('❌ Push manager not supported', null, 'PushManager API not available', true);
    toast({ title: "Error", description: "Push notifications are not supported in this browser", variant: "destructive" });
    return false;
  }

  try {
    let permission = Notification.permission;
    const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'web');
    const isIos = platform === 'ios';
    
    logStep('📋 Initial state', { 
      permission, 
      platform, 
      isStandalone, 
      userAgent: navigator.userAgent.slice(0, 50) + '...'
    }, true);

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

    // Handle permission request
    if (permission === 'default') {
      logStep('🔑 Requesting permission from user');
      
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
        await mobileLog('❌ Permission request failed', null, error as Error, true);
        toast({ title: "Permission denied", description: "Could not request notification permission", variant: "destructive" });
        return false;
      }
    } else {
      logStep('ℹ️ Permission already set', { permission });
    }

    if (permission !== 'granted') {
      logStep('❌ Permission not granted', { permission });
      
      if (permission === 'denied') {
        toast({ 
          title: "Notifications blocked", 
          description: "Please enable notifications in your browser settings", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Permission required", 
          description: "Please allow notifications to continue", 
          variant: "destructive" 
        });
      }
      
      return false;
    }

    logStep('✅ Permission granted, proceeding with subscription', null, true);

    // Create push subscription
    let sub: PushSubscription | null = null;
    
    try {
      // First, check for existing subscription
      logStep('🔍 Checking for existing subscription');
      sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        logStep('♻️ Found existing subscription, reusing', {
          endpoint: sub.endpoint?.slice(0, 50) + '...',
          keys: !!sub.toJSON().keys
        });
      } else {
        logStep('🆕 Creating new subscription');
        
        // Detailed VAPID key logging for debugging
        logStep('🔑 VAPID key info', {
          vapidKeyLength: VAPID_PUBLIC_KEY.length,
          vapidKeyStart: VAPID_PUBLIC_KEY.substring(0, 20) + '...',
          pushManagerExists: !!reg.pushManager,
          pushManagerSupported: 'PushManager' in window
        });
        
        const subscribeFunction = async () => {
          logStep('📡 Attempting push subscription with VAPID key');
          const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          logStep('🔢 Converted VAPID key', {
            arrayLength: applicationServerKey.length,
            firstBytes: Array.from(applicationServerKey.slice(0, 5))
          });
          
          return await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        };

        // Retry for iOS reliability
        if (isIos) {
          logStep('🍎 Using iOS retry logic (3 attempts)');
          sub = await retryWithDelay(subscribeFunction, 3, 1000);
        } else {
          sub = await subscribeFunction();
        }
        
        logStep('✅ Successfully created subscription', {
          endpoint: sub.endpoint?.slice(0, 50) + '...',
          keys: !!sub.toJSON().keys
        });
      }
    } catch (error) {
      await mobileLog('❌ Failed to create/get subscription', {
        error: error.message,
        name: error.name,
        stack: error.stack?.split('\n')[0]
      }, error as Error, true);
      
      // More specific error messages
      let errorMessage = "Could not create push subscription.";
      if (error.name === 'NotSupportedError') {
        errorMessage = "Push notifications are not supported on this device.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Notification permission was denied.";
      } else if (error.message.includes('VAPID')) {
        errorMessage = "Server configuration issue. Please try again later.";
      }
      
      toast({ 
        title: "Subscription failed", 
        description: errorMessage + " Please try again.", 
        variant: "destructive" 
      });
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
      await mobileLog('❌ Invalid subscription data', { endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth }, 'Missing subscription keys', true);
      toast({ title: "Invalid subscription", description: "Subscription data is incomplete", variant: "destructive" });
      return false;
    }

    // Resolve user ID from WebAuthn
    logStep('🔍 Resolving user ID from WebAuthn');
    let userId: string | null = null;
    const userHandle = getStoredUserHandle();
    
    if (userHandle) {
      try {
        const { data: userLink, error } = await (supabase as any)
          .from('webauthn_user_links')
          .select('user_id')
          .eq('user_handle', userHandle)
          .single();
        
        if (!error && userLink?.user_id) {
          userId = userLink.user_id;
          logStep('✅ Successfully resolved user ID', { userId: 'found' });
        }
      } catch (error) {
        logStep('⚠️ Could not resolve WebAuthn user handle to user_id', error);
        // Continue without user_id - the backend can handle this
      }
    }

    // Save subscription to backend
    logStep('💾 Saving subscription to backend', {
      hasEndpoint: !!endpoint,
      hasP256dh: !!p256dh,
      hasAuth: !!auth,
      userId: userId ? 'present' : 'null',
      platform,
      endpointLength: endpoint?.length
    }, true);
    
    try {
      const saveBody = {
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        platform,
        user_id: userId,
      };
      
      logStep('📤 Calling save-push-subscription with payload', {
        bodyKeys: Object.keys(saveBody),
        endpointProvider: endpoint?.includes('fcm') ? 'FCM' : 
                         endpoint?.includes('mozilla') ? 'Mozilla' :
                         endpoint?.includes('webpush') ? 'WebPush' : 'Unknown'
      });
      
      const { data, error } = await supabase.functions.invoke('save-push-subscription', {
        body: saveBody,
      });
      
      logStep('📥 save-push-subscription response', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        dataKeys: data ? Object.keys(data) : null
      });
      
      if (error) {
        // Enhanced error logging with backend response details
        const errorStep = '❌ Save subscription failed - Backend error';
        const errorData = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          endpoint: endpoint?.slice(0, 100) + '...',
          endpointDomain: new URL(endpoint).hostname,
          platform,
          userAgent: navigator.userAgent.slice(0, 100) + '...'
        };
        
        await mobileLog(errorStep, errorData, error, true);
        
        // Show user-friendly error message based on error type
        let userMessage = error.message;
        if (error.message?.includes('Invalid push endpoint format')) {
          userMessage = `Your device's push service (${new URL(endpoint).hostname}) is not supported yet. This typically happens on newer iOS devices.`;
        } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
          userMessage = 'Too many attempts. Please wait a minute and try again.';
        }
        
        throw new Error(userMessage);
      }
      
      logStep('✅ Successfully saved subscription', { 
        subscriptionId: data?.subscription_id,
        responseData: data 
      });

      // Track successful subscribe
      logStep('📊 Tracking subscribed event');
      try {
        await supabase.functions.invoke('track-push-optin', {
          body: {
            event: 'subscribed',
            subscription_id: data?.subscription_id,
            platform,
            user_agent: navigator.userAgent,
            endpoint,
          },
        });
        logStep('✅ Successfully tracked subscribed event');
      } catch (trackError) {
        console.warn('⚠️ Failed to track subscribed event:', trackError);
        // Don't fail the whole process for tracking errors
      }

      logStep('🎉 Notification enablement completed successfully', null, true);
      toast({ title: "Success!", description: "Notifications enabled successfully", variant: "default" });
      return true;
      
    } catch (error) {
      await mobileLog('❌ Failed to save subscription', null, error as Error, true);
      toast({ 
        title: "Save failed", 
        description: "Could not register device for notifications. Please try again.", 
        variant: "destructive" 
      });
      return false;
    }
    
  } catch (e) {
    await mobileLog('💥 Fatal error in enableNotifications', null, e as Error, true);
    toast({ 
      title: "Unexpected error", 
      description: "Something went wrong. Please try again later.", 
      variant: "destructive" 
    });
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
