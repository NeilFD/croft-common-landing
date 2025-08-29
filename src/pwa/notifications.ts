
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
    toast({ title: "Error", description: "Notifications are not supported in this browser", variant: "destructive" });
    return false;
  }

  if (!('PushManager' in window)) {
    logStep('❌ Push manager not supported');
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
        logStep('❌ Permission request failed', error);
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

    logStep('✅ Permission granted, proceeding with subscription');

    // Create push subscription
    let sub: PushSubscription | null = null;
    
    try {
      // First, check for existing subscription
      logStep('🔍 Checking for existing subscription');
      sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        logStep('♻️ Found existing subscription, reusing');
      } else {
        logStep('🆕 Creating new subscription');
        
        const subscribeFunction = async () => {
          return await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        };

        // Retry for iOS reliability
        if (isIos) {
          sub = await retryWithDelay(subscribeFunction, 3, 1000);
        } else {
          sub = await subscribeFunction();
        }
        
        logStep('✅ Successfully created subscription');
      }
    } catch (error) {
      logStep('❌ Failed to create/get subscription', error);
      toast({ 
        title: "Subscription failed", 
        description: "Could not create push subscription. Please try again.", 
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
      logStep('❌ Invalid subscription data', { endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth });
      toast({ title: "Invalid subscription", description: "Subscription data is incomplete", variant: "destructive" });
      return false;
    }

    // Resolve user ID from WebAuthn
    logStep('🔍 Resolving user ID from WebAuthn');
    let userId: string | null = null;
    const userHandle = getStoredUserHandle();
    
    if (userHandle) {
      try {
        const { data: userLink, error } = await supabase
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
    logStep('💾 Saving subscription to backend');
    
    try {
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
      
      if (error) {
        throw error;
      }
      
      logStep('✅ Successfully saved subscription', { subscriptionId: data?.subscription_id });

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

      logStep('🎉 Notification enablement completed successfully');
      toast({ title: "Success!", description: "Notifications enabled successfully", variant: "default" });
      return true;
      
    } catch (error) {
      logStep('❌ Failed to save subscription', error);
      toast({ 
        title: "Save failed", 
        description: "Could not register device for notifications. Please try again.", 
        variant: "destructive" 
      });
      return false;
    }
    
  } catch (e) {
    logStep('💥 Fatal error in enableNotifications', e);
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
