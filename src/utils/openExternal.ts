import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Opens a URL in a native-aware way:
 * - On native: uses Capacitor Browser for all URLs
 * - On web: uses window.open for http/https, window.location.href for mailto:/tel:
 */
export async function openExternal(url: string): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  
  console.log('🔗 openExternal:', { url, isNative });

  // Handle mailto: and tel: links
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    if (isNative) {
      try {
        await Browser.open({ url });
        console.log('🔗 Opened mailto/tel via Browser.open');
        return;
      } catch (e) {
        console.warn('🔗 Browser.open failed for mailto/tel, falling back', e);
      }
    }
    // Fallback for web or if native fails
    window.location.href = url;
    return;
  }

  // Handle http/https links
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (isNative) {
      try {
        await Browser.open({ url, presentationStyle: 'popover' });
        console.log('🔗 Opened external URL via Browser.open');
        return;
      } catch (e) {
        console.warn('🔗 Browser.open failed, falling back', e);
      }
    }
    // Fallback for web or if native fails
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // For relative URLs or other schemes, just open normally
  console.warn('🔗 Non-http/mailto/tel URL, using window.open:', url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Check if we're running in a native environment
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
