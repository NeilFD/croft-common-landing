import { createPortal } from 'react-dom';

export const SafeAreaTopCap = () => {
  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[100000] bg-background/95 backdrop-blur-sm pointer-events-none"
      style={{ height: 'env(safe-area-inset-top)' }}
      aria-hidden="true"
    />,
    document.body
  );
};