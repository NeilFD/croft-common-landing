
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isStandalone, isIosSafari } from './registerPWA';

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
    toast({ title: 'Notifications unsupported', description: 'This browser does not support notifications.', variant: 'destructive' });
    return false;
  }
  try {
    let permission = Notification.permission;
    if (import.meta.env.DEV) {
      console.log('[Notifications] Initial permission:', permission, { isStandalone, isIos: isIosSafari() });
    }

    if (permission === 'default') {
      permission = await Notification.requestPermission();
      if (import.meta.env.DEV) console.log('[Notifications] After requestPermission:', permission);
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

      toast({ title: 'Permission not granted', description });
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

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id ?? null;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        platform: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'web'),
        user_id: userId,
        is_active: true,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('Failed saving subscription:', error);
      toast({ title: 'Could not save subscription', description: 'Please try again later.', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Notifications enabled', description: 'You will receive updates from Croft Common.' });
    return true;
  } catch (e) {
    console.error('Subscription error:', e);
    let description = 'Please try again later.';
    if (isIosSafari()) {
      description = !isStandalone
        ? 'Install the app to your Home Screen first, then try again.'
        : 'If you just changed Settings, force-quit and reopen the app, then try again.';
    }
    toast({ title: 'Subscription failed', description, variant: 'destructive' });
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
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
    if (import.meta.env.DEV) console.log('[Notifications] Reset complete, re-enabling…');
    return await enableNotifications(reg);
  } catch (e) {
    console.error('Reset notifications error:', e);
    toast({ title: 'Reset failed', description: 'Please try again later.', variant: 'destructive' });
    return false;
  }
}
