import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export const initStatusBar = async () => {
  try {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;

    // Overlay the WebView so content can extend behind the iOS status bar
    await StatusBar.setOverlaysWebView({ overlay: true });

    // Use dark content (light text) to match the app's dark header aesthetic
    await StatusBar.setStyle({ style: Style.Dark });

    // Note: setBackgroundColor is Android-only; iOS ignores it when overlaying
  } catch (err) {
    console.warn('StatusBar init skipped:', err);
  }
};
