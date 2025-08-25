
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

export async function enableNotifications(reg: ServiceWorkerRegistration): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  try {
    let permission = Notification.permission;
    const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'web');
    if (import.meta.env.DEV) {
      console.log('[Notifications] Initial permission:', permission, { isStandalone, isIos: isIosSafari() });
    }

    // Track prompt shown
    void supabase.functions.invoke('track-push-optin', {
      body: { event: 'prompt_shown', platform, user_agent: navigator.userAgent },
    });

    if (permission === 'default') {
      permission = await Notification.requestPermission();
      if (import.meta.env.DEV) console.log('[Notifications] After requestPermission:', permission);
      // Track grant/deny result
      void supabase.functions.invoke('track-push-optin', {
        body: { event: permission === 'granted' ? 'granted' : 'denied', platform, user_agent: navigator.userAgent },
      });
    }

    if (permission !== 'granted') {
      let description = permission === 'denied'
        ? 'You can enable notifications in your browser settings.'
        : 'Please try again, or enable notifications in your browser settings.';

      if (isIosSafari()) {
        description = !isStandalone
          ? 'On iPhone, add the app to your Home Screen first (Share → Add to Home Screen). Open it, then enable notifications.'
          : 'On iPhone, go to Settings → Notifications → Croft Common → Allow Notifications. Then force-quit and reopen the app.';
      }

      return false;
    }

    // Try to reuse existing subscription first
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (import.meta.env.DEV) console.log('[Notifications] No existing subscription, subscribing…');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } else {
      if (import.meta.env.DEV) console.log('[Notifications] Reusing existing subscription');
    }

  const raw = sub.toJSON() as any;
  const endpoint = raw.endpoint;
  const p256dh = raw.keys?.p256dh;
  const auth = raw.keys?.auth;

  // Get user ID from WebAuthn user handle since this app uses WebAuthn auth
  let userId: string | null = null;
  const userHandle = getStoredUserHandle();
  
  if (userHandle) {
    try {
      const { data: userLink } = await supabase
        .from('webauthn_user_links')
        .select('user_id')
        .eq('user_handle', userHandle)
        .single();
      
      userId = userLink?.user_id ?? null;
      if (import.meta.env.DEV) {
        console.log('[Notifications] WebAuthn user handle:', userHandle, 'resolved to user_id:', userId);
      }
    } catch (error) {
      console.warn('[Notifications] Could not resolve WebAuthn user handle to user_id:', error);
    }
  }

  const { data: saveData, error } = await supabase.functions.invoke('save-push-subscription', {
    body: {
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      platform,
      user_id: userId, // Pass the WebAuthn-resolved user_id
    },
  });

  if (error) {
    console.error('Failed saving subscription:', error);
    return false;
  }

  // Track successful subscribe
  void supabase.functions.invoke('track-push-optin', {
    body: {
      event: 'subscribed',
      subscription_id: saveData?.subscription_id,
      platform,
      user_agent: navigator.userAgent,
      endpoint,
    },
  });

  return true;
  } catch (e) {
    console.error('Subscription error:', e);
    let description = 'Please try again later.';
    if (isIosSafari()) {
      description = !isStandalone
        ? 'Install the app to your Home Screen first, then try again.'
        : 'If you just changed Settings, force-quit and reopen the app, then try again.';
    }
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
