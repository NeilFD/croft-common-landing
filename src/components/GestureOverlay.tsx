import React, { useRef, useCallback, useEffect } from 'react';
import useGestureDetection from '@/hooks/useGestureDetection';
import { toast } from '@/hooks/use-toast';

interface GestureOverlayProps {
  onGestureComplete: () => void;
  containerRef?: React.RefObject<HTMLElement>;
}

const GestureOverlay: React.FC<GestureOverlayProps> = ({ onGestureComplete, containerRef }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const handleGestureSuccess = useCallback(() => {
    toast({
      title: "Access Granted",
      description: "Welcome to The Common Room, for Common People",
      duration: 2000,
    });
    onGestureComplete();
  }, [onGestureComplete]);
  
  const {
    isDrawing,
    points,
    isComplete,
    startGesture,
    addPoint,
    endGesture
  } = useGestureDetection(handleGestureSuccess);

  const getEventPosition = useCallback((event: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    const container = containerRef?.current || overlayRef.current;
    const rect = container?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else if ('clientX' in event) {
      // Mouse event
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  }, [containerRef]);

  // Helper to check if target is interactive
  const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const element = target as HTMLElement;
    
    // Check if element is inside a modal/dialog (has data-radix-* attributes or high z-index)
    let checkElement: HTMLElement | null = element;
    while (checkElement) {
      // Check for Radix UI dialog/modal attributes
      if (checkElement.hasAttribute('data-radix-dialog-content') || 
          checkElement.hasAttribute('data-radix-dialog-overlay') ||
          checkElement.getAttribute('role') === 'dialog' ||
          checkElement.getAttribute('role') === 'alertdialog') {
        return true;
      }
      
      // Check if element has high z-index indicating it's a modal
      const computedStyle = window.getComputedStyle(checkElement);
      const zIndex = parseInt(computedStyle.zIndex);
      if (!isNaN(zIndex) && zIndex >= 50) {
        return true;
      }
      
      checkElement = checkElement.parentElement;
    }
    
    // Check if element is a button or link
    if (interactiveElements.includes(element.tagName)) return true;
    
    // Check if element has button role or is clickable
    if (element.hasAttribute('role') && element.getAttribute('role') === 'button') return true;
    if (element.style.cursor === 'pointer') return true;
    
    // Check if parent elements are interactive (for nested content)
    let parent = element.parentElement;
    while (parent && parent !== containerRef?.current) {
      if (interactiveElements.includes(parent.tagName)) return true;
      if (parent.hasAttribute('role') && parent.getAttribute('role') === 'button') return true;
      if (parent.style.cursor === 'pointer') return true;
      parent = parent.parentElement;
    }
    
    return false;
  }, [containerRef]);

  // Touch events (mobile)
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    
    // Don't prevent default on touchstart - this allows natural scrolling
    
    // Clear any existing text selection
    try {
      window.getSelection()?.removeAllRanges();
    } catch {}
    
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isInteractiveElement]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // Allow scrolling if not drawing a gesture
    if (!isDrawing) return;
    
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    
    // Always prevent default during gesture drawing to avoid text selection
    event.preventDefault();
    
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing, isInteractiveElement]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    
    // Only prevent default if we were drawing
    if (isDrawing) {
      event.preventDefault();
    }
    endGesture();
  }, [endGesture, isDrawing, isInteractiveElement]);

  // Mouse events (desktop)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    // Do not prevent default on initial mousedown; allow native clicks
    try {
      window.getSelection()?.removeAllRanges();
    } catch {}
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isInteractiveElement]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing, isInteractiveElement]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    if (isDrawing) {
      event.preventDefault();
    }
    endGesture();
  }, [endGesture, isInteractiveElement, isDrawing]);

  // Attach listeners to provided container instead of overlay
  useEffect(() => {
    if (!containerRef?.current) return;
    const el = containerRef.current as HTMLElement;
    // Ensure no stray disabled attribute can block interactions
    el.removeAttribute('disabled');
    const prevTouchAction = el.style.touchAction;
    const prevUserSelect = el.style.userSelect;
    const prevWebkitUserSelect = (el.style as any).webkitUserSelect;
    const prevWebkitTouchCallout = (el.style as any).webkitTouchCallout;
    
    // Allow natural scrolling - don't override touchAction, let parent handle it
    el.style.userSelect = 'none';
    (el.style as any).webkitUserSelect = 'none';
    (el.style as any).webkitTouchCallout = 'none';
    (el.style as any).webkitTapHighlightColor = 'transparent';
    el.classList.add('gesture-container');

    const ts = (e: TouchEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Use passive listener - don't prevent default, allow natural scrolling
      // Clear any existing text selection
      try {
        window.getSelection()?.removeAllRanges();
      } catch {}
      
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    
    const tm = (e: TouchEvent) => {
      // Allow scrolling if not drawing a gesture  
      if (!isDrawing) return;
      
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Don't prevent default to allow scrolling even during gesture
      // This means gestures and scrolling can happen simultaneously
      
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    
    const te = (e: TouchEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Don't prevent default to allow natural touch behavior
      endGesture();
    };

    const md = (e: MouseEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      // Do not prevent default on initial mousedown; allow native clicks
      try {
        window.getSelection()?.removeAllRanges();
      } catch {}
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    
    const mm = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    
    const mu = (e: MouseEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      if (isDrawing) {
        e.preventDefault();
      }
      endGesture();
    };

    // Use passive listeners for touch events to allow natural scrolling
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: true }); // Make touchmove passive too for scrolling
    el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('mousedown', md);
    el.addEventListener('mousemove', mm);
    el.addEventListener('mouseup', mu);

    return () => {
      el.style.userSelect = prevUserSelect;
      (el.style as any).webkitUserSelect = prevWebkitUserSelect;
      (el.style as any).webkitTouchCallout = prevWebkitTouchCallout;
      el.classList.remove('gesture-container');
      // Ensure no lingering disabled attribute remains
      el.removeAttribute('disabled');
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
      el.removeEventListener('mousedown', md);
      el.removeEventListener('mousemove', mm);
      el.removeEventListener('mouseup', mu);
    };
  }, [containerRef, getEventPosition, startGesture, addPoint, endGesture, isDrawing, isInteractiveElement, points]);

  // If no containerRef provided, attach global listeners to document for non-blocking gesture capture
  useEffect(() => {
    if (containerRef?.current) return;

    const ts = (e: TouchEvent) => {
      if (isInteractiveElement(e.target)) return;
      try { window.getSelection()?.removeAllRanges(); } catch {}
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    const tm = (e: TouchEvent) => {
      if (!isDrawing) return;
      if (isInteractiveElement(e.target)) return;
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    const te = (e: TouchEvent) => {
      if (isInteractiveElement(e.target)) return;
      endGesture();
    };
    const md = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      // Do not prevent default on initial mousedown; allow native clicks
      try { window.getSelection()?.removeAllRanges(); } catch {}
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    const mm = (e: MouseEvent) => {
      if (!isDrawing) return;
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    const mu = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      if (isDrawing) {
        e.preventDefault();
      }
      endGesture();
    };

    document.addEventListener('touchstart', ts, { passive: true });
    document.addEventListener('touchmove', tm, { passive: true });
    document.addEventListener('touchend', te, { passive: true });
    document.addEventListener('mousedown', md);
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);

    return () => {
      document.removeEventListener('touchstart', ts);
      document.removeEventListener('touchmove', tm);
      document.removeEventListener('touchend', te);
      document.removeEventListener('mousedown', md);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
    };
  }, [containerRef, getEventPosition, startGesture, addPoint, endGesture, isDrawing, isInteractiveElement]);

  // If containerRef is provided, don't render overlay - gesture detection happens on the container
  if (containerRef) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-transparent"
      style={{ 
        pointerEvents: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    />
  );
};

export default GestureOverlay;