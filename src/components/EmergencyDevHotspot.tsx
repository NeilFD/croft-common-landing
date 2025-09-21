import { useHiddenDevPanel } from '@/hooks/useHiddenDevPanel';
import { useLongPress } from '@/hooks/useLongPress';

export const EmergencyDevHotspot = () => {
  const { openPanel } = useHiddenDevPanel();
  
  // Only show in dev mode (URL param) or non-production
  const shouldShow = new URLSearchParams(window.location.search).get('dev') === '1' || 
                     import.meta.env.DEV;

  const longPressHandlers = useLongPress({
    onLongPress: openPanel,
    delay: 1500 // Slightly longer delay for emergency hotspot
  });

  if (!shouldShow) return null;

  return (
    <div
      className="fixed bottom-4 left-4 w-8 h-8 z-50 cursor-pointer opacity-0 hover:opacity-20 transition-opacity"
      title="Emergency dev panel (1.5s hold)"
      {...longPressHandlers}
    />
  );
};