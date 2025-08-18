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

  const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false;
    const element = target as HTMLElement;
    
    // Check if target or any parent is interactive
    let current = element;
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const role = current.getAttribute('role');
      const isButton = tagName === 'button' || role === 'button';
      const isLink = tagName === 'a';
      const isInput = ['input', 'textarea', 'select'].includes(tagName);
      const hasPointerEvents = getComputedStyle(current).pointerEvents !== 'none';
      const isClickable = current.onclick !== null || current.getAttribute('onclick');
      
      if ((isButton || isLink || isInput || isClickable) && hasPointerEvents) {
        return true;
      }
      current = current.parentElement as HTMLElement;
    }
    return false;
  }, []);

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

  // Touch events (mobile)
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) {
      return;
    }
    
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isInteractiveElement]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // Only prevent default if we're actively drawing a gesture
    if (isDrawing) {
      event.preventDefault();
      const { x, y } = getEventPosition(event);
      addPoint(x, y);
    }
  }, [getEventPosition, addPoint, isDrawing]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (isDrawing) {
      event.preventDefault();
      endGesture();
    }
  }, [endGesture, isDrawing]);

  // Mouse events (desktop)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) {
      return;
    }
    
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isInteractiveElement]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (isDrawing) {
      event.preventDefault();
      endGesture();
    }
  }, [endGesture, isDrawing]);

  // Attach listeners to provided container instead of overlay
  useEffect(() => {
    if (!containerRef?.current) return;
    const el = containerRef.current as HTMLElement;
    const prevTouchAction = el.style.touchAction;
    const prevUserSelect = el.style.userSelect;
    const prevWebkitUserSelect = (el.style as any).webkitUserSelect;
    const prevWebkitTouchCallout = (el.style as any).webkitTouchCallout;
    
    el.style.touchAction = 'pan-y'; // Allow vertical scrolling but prevent horizontal pan
    el.style.userSelect = 'none';
    (el.style as any).webkitUserSelect = 'none';
    (el.style as any).webkitTouchCallout = 'none';

    const ts = (e: TouchEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) {
        return;
      }
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    const tm = (e: TouchEvent) => {
      // Only prevent default if we're actively drawing a gesture
      if (isDrawing) {
        e.preventDefault();
        const { x, y } = getEventPosition(e);
        addPoint(x, y);
      }
    };
    const te = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
        endGesture();
      }
    };

    const md = (e: MouseEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) {
        return;
      }
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    const mm = (e: MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    const mu = (e: MouseEvent) => {
      if (isDrawing) {
        e.preventDefault();
        endGesture();
      }
    };

    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te, { passive: false });
    el.addEventListener('mousedown', md);
    el.addEventListener('mousemove', mm);
    el.addEventListener('mouseup', mu);

    return () => {
      el.style.touchAction = prevTouchAction;
      el.style.userSelect = prevUserSelect;
      (el.style as any).webkitUserSelect = prevWebkitUserSelect;
      (el.style as any).webkitTouchCallout = prevWebkitTouchCallout;
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
      el.removeEventListener('mousedown', md);
      el.removeEventListener('mousemove', mm);
      el.removeEventListener('mouseup', mu);
    };
  }, [containerRef, getEventPosition, startGesture, addPoint, endGesture, isDrawing, isInteractiveElement]);

  // If containerRef is provided, don't render overlay - gesture detection happens on the container
  if (containerRef) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-transparent select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ 
        touchAction: 'pan-y', // Allow vertical scrolling
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    />
  );
};

export default GestureOverlay;