
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function enableNotifications(reg: ServiceWorkerRegistration) {
  if (!('Notification' in window)) {
    toast({ title: 'Notifications unsupported', description: 'This browser does not support notifications.', variant: 'destructive' });
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    toast({ title: 'Permission denied', description: 'You can enable notifications in your browser settings.' });
    return;
  }
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

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
      return;
    }

    toast({ title: 'Notifications enabled', description: 'You will receive updates from Croft Common.' });
  } catch (e) {
    console.error('Subscription error:', e);
    toast({ title: 'Subscription failed', description: 'Please try again later.', variant: 'destructive' });
  }
}
