/**
 * Detects if the app is running inside the Lovable builder preview iframe
 */
export function isInPreviewIframe(): boolean {
  try {
    // Check if we're in an iframe and if the parent is a different origin (sandbox)
    return window.self !== window.top && window.location !== window.parent.location;
  } catch {
    // If we get a cross-origin error, we're definitely in an iframe with different origin
    return true;
  }
}
