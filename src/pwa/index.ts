
import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';

// Boot the PWA layer: register SW and mount overlay UI when appropriate
(async () => {
  const reg = await registerServiceWorker();
  if (!isStandalone) {
    mountInstallOverlay();
  }
  // Optionally, expose registration for debugging
  (window as any).__pwaReg = reg;
})();
