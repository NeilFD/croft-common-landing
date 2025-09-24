import { createPortal } from 'react-dom';
import { useIOSDetection } from '@/hooks/useIOSDetection';

export const SafeAreaTopCap = () => {
  const { isIOS, isPWAStandalone, isCapacitorNative } = useIOSDetection();
  const isNativeIOS = isIOS && (isPWAStandalone || isCapacitorNative);

  if (!isNativeIOS) return null;

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-sm pointer-events-none"
      style={{ height: 'env(safe-area-inset-top)' }}
      aria-hidden="true"
    />,
    document.body
  );
};