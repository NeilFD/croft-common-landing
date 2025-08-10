
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { setupInstallPromptListener, isStandalone, isIosSafari, BeforeInstallPromptEvent } from './registerPWA';
import { enableNotifications } from './notifications';

function isiOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

const Overlay: React.FC = () => {
  const [show, setShow] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [canInstallAndroid, setCanInstallAndroid] = useState(false);

  const shouldShow = useMemo(() => {
    if (isStandalone) return false;
    if (!(isiOS() || isAndroid())) return false;
    return show;
  }, [show]);

  useEffect(() => {
    // Capture Android install prompt availability
    setupInstallPromptListener(
      () => {
        setCanInstallAndroid(true);
        setShow(true);
      },
      () => setShow(false)
    );

    // On iOS (no beforeinstallprompt), show the bar by default
    if (isIosSafari()) {
      setShow(true);
    }

    // Get SW registration if available
    (async () => {
      if ('serviceWorker' in navigator) {
        try {
          const r = await navigator.serviceWorker.getRegistration();
          setReg(r ?? null);
        } catch { /* no-op */ }
      }
    })();
  }, []);

  const onInstallClick = async () => {
    // Android: use captured prompt
    const dp = (window as any).deferredPrompt as BeforeInstallPromptEvent | undefined;
    if (dp) {
      await dp.prompt();
      const choice = await dp.userChoice;
      if (choice.outcome === 'accepted') {
        setShow(false);
      }
      (window as any).deferredPrompt = null;
      return;
    }
    // iOS: show instructions
    if (isIosSafari()) {
      setShowIOSHelp((v) => !v);
    }
  };

  const onEnableNotifications = async () => {
    if (!reg) {
      const r = await navigator.serviceWorker.getRegistration();
      if (r) setReg(r);
    }
    if (reg) {
      await enableNotifications(reg);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-screen-sm rounded-xl bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border shadow-lg">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Download “Croft Common”</span>
            <span className="text-xs text-muted-foreground">Add to your Home Screen for a faster app-like experience.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEnableNotifications}
              className="text-xs px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Enable notifications
            </button>
            <button
              onClick={onInstallClick}
              className="text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {canInstallAndroid ? 'Install app' : 'How to install'}
            </button>
          </div>
        </div>
        {showIOSHelp && (
          <div className="px-4 pb-3">
            <div className="rounded-lg bg-muted/60 text-muted-foreground p-3 text-xs leading-relaxed">
              <div className="font-medium text-foreground mb-1">iPhone/iPad</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the Share icon in Safari.</li>
                <li>Scroll down and tap “Add to Home Screen”.</li>
                <li>Tap Add.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function mountInstallOverlay() {
  const id = 'pwa-install-overlay-root';
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
  }
  const root = ReactDOM.createRoot(container);
  root.render(<Overlay />);
}
