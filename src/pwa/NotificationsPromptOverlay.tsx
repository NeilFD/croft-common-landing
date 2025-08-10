import React, { useEffect, useMemo, useState } from 'react';
import { enableNotifications } from './notifications';
import { isStandalone, isIosSafari } from './registerPWA';

// Key to avoid nagging users repeatedly
const DISMISS_KEY = 'notifications_prompt_dismissed_v1';

function canAskForNotifications() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return false;
  return true;
}

const Banner: React.FC<{ onClose: () => void } & { swReg: ServiceWorkerRegistration | null }> = ({ onClose, swReg }) => {
  const [loading, setLoading] = useState(false);

  const onEnable = async () => {
    let reg = swReg;
    if (!reg) {
      // Try to get a registration just-in-time
      reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        try {
          reg = await navigator.serviceWorker.ready;
        } catch (e) {
          reg = null as any;
        }
      }
    }
    if (!reg) return;
    setLoading(true);
    await enableNotifications(reg);
    setLoading(false);
    // Hide if permission granted now
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      localStorage.setItem(DISMISS_KEY, '1');
      onClose();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[10000] px-4">
      <div className="mx-auto max-w-xl rounded-lg border bg-card text-card-foreground shadow-lg">
        <div className="p-4">
          <h3 className="text-sm font-medium">Enable notifications</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get updates from Croft Common. You can change this later in your settings.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onEnable}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Enabling…' : 'Enable notifications'}
            </button>
            <button
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1');
                onClose();
              }}
              className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsOverlay: React.FC<{ swReg: ServiceWorkerRegistration | null }> = ({ swReg }) => {
  const [show, setShow] = useState(false);

  const shouldShow = useMemo(() => {
    if (!isStandalone) return false; // Only after added to Home Screen
    if (!canAskForNotifications()) return false;
    if (localStorage.getItem(DISMISS_KEY) === '1') return false;
    // Prefer focusing iOS PWAs where this was reported, but allow others too
    return isIosSafari() || true;
  }, []);

  useEffect(() => {
    if (shouldShow) setShow(true);
  }, [shouldShow]);

  if (!show) return null;

  return <Banner onClose={() => setShow(false)} swReg={swReg} />;
};

export function mountNotificationsOverlay(swReg: ServiceWorkerRegistration | null) {
  // Avoid multiple mounts
  const existing = document.getElementById('notifications-overlay-root');
  if (existing) return;

  const container = document.createElement('div');
  container.id = 'notifications-overlay-root';
  document.body.appendChild(container);

  // Lazy import client renderer to keep initial bundle lean
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(container);
    root.render(React.createElement(NotificationsOverlay, { swReg }));
  });
}
