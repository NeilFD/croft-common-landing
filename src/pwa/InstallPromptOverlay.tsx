import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setupInstallPromptListener, isStandalone, isIosSafari, BeforeInstallPromptEvent } from './registerPWA';
import { enableNotifications } from './notifications';
import { toast } from '@/hooks/use-toast';
import CroftLogo from '@/components/CroftLogo';
import { X } from 'lucide-react';

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
    console.log('🔔 Enable notifications clicked - iOS Safari:', isIosSafari(), 'Standalone:', isStandalone);
    
    try {
      // Get or refresh service worker registration
      if (!reg) {
        const r = await navigator.serviceWorker.getRegistration();
        if (r) {
          setReg(r);
        } else {
          toast({
            title: 'Service worker not available',
            description: 'Please refresh the page and try again.',
            variant: 'destructive'
          });
          return;
        }
      }

      // Always attempt to enable notifications - let the enableNotifications function handle iOS specifics
      if (reg) {
        console.log('🔔 Calling enableNotifications with registration:', reg);
        const success = await enableNotifications(reg);
        if (success) {
          toast({
            title: 'Notifications enabled!',
            description: 'You\'ll now receive important updates from Croft Common.',
          });
          setShow(false); // Hide the overlay on success
        } else {
          toast({
            title: 'Enable notifications',
            description: 'Please allow notifications in your browser settings.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('🔔 Error enabling notifications:', error);
      toast({
        title: 'Error enabling notifications',
        description: error instanceof Error ? error.message : 'Please try again or check your browser settings.',
        variant: 'destructive'
      });
    }
  };
  
  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-screen-sm rounded-xl bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border shadow-lg">
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <CroftLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Download "Croft Common"</span>
              <span className="text-xs text-muted-foreground">Add to your Home Screen for a faster app-like experience.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                onClick={onEnableNotifications}
                className="text-xs px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full"
              >
                Enable notifications
              </button>
              <button
                onClick={onInstallClick}
                className="text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 w-full"
              >
                {canInstallAndroid ? 'Install app' : 'How to install'}
              </button>
            </div>
            <button
              onClick={() => setShow(false)}
              aria-label="Dismiss"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {showIOSHelp && (
          <div className="px-4 pb-3">
            <div className="rounded-lg bg-muted/60 text-muted-foreground p-3 text-xs leading-relaxed">
              <div className="font-medium text-foreground mb-1">iPhone/iPad</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the Share icon in Safari.</li>
                <li>Scroll down and tap "Add to Home Screen".</li>
                <li>Tap Add.</li>
                <li>After installing, open the app from your Home Screen, then enable notifications.</li>
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
  const root = createRoot(container);
  root.render(<Overlay />);
}