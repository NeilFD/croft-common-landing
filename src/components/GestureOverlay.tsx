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
    
    // Don't prevent default - allow normal touch behavior initially
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture, isInteractiveElement]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // Allow scrolling if not drawing a gesture
    if (!isDrawing) return;
    
    // Allow interactive elements to function normally
    if (isInteractiveElement(event.target)) return;
    
    // Only prevent default if we have multiple points and movement is gesture-like
    if (points.length > 2) {
      const currentPos = getEventPosition(event);
      const firstPoint = points[0];
      const totalDeltaX = Math.abs(currentPos.x - firstPoint.x);
      const totalDeltaY = Math.abs(currentPos.y - firstPoint.y);
      
      // If horizontal movement is significant, treat as gesture
      if (totalDeltaX > 30 || (totalDeltaX > totalDeltaY * 0.5)) {
        event.preventDefault();
      }
    }
    
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing, isInteractiveElement, points]);

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
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    endGesture();
  }, [endGesture]);

  // Attach listeners to provided container instead of overlay
  useEffect(() => {
    if (!containerRef?.current) return;
    const el = containerRef.current as HTMLElement;
    const prevTouchAction = el.style.touchAction;
    const prevUserSelect = el.style.userSelect;
    const prevWebkitUserSelect = (el.style as any).webkitUserSelect;
    const prevWebkitTouchCallout = (el.style as any).webkitTouchCallout;
    
    // Allow normal touch behavior for scrolling
    el.style.touchAction = 'auto';
    el.style.userSelect = 'none';
    (el.style as any).webkitUserSelect = 'none';
    (el.style as any).webkitTouchCallout = 'none';

    const ts = (e: TouchEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Don't prevent default - allow normal touch behavior initially
      const { x, y } = getEventPosition(e);
      startGesture(x, y);
    };
    const tm = (e: TouchEvent) => {
      // Allow scrolling if not drawing a gesture
      if (!isDrawing) return;
      
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Only prevent default if we have multiple points and movement is gesture-like
      if (points.length > 2) {
        const currentPos = getEventPosition(e);
        const firstPoint = points[0];
        const totalDeltaX = Math.abs(currentPos.x - firstPoint.x);
        const totalDeltaY = Math.abs(currentPos.y - firstPoint.y);
        
        // If horizontal movement is significant, treat as gesture
        if (totalDeltaX > 30 || (totalDeltaX > totalDeltaY * 0.5)) {
          e.preventDefault();
        }
      }
      
      const { x, y } = getEventPosition(e);
      addPoint(x, y);
    };
    const te = (e: TouchEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      // Only prevent default if we were drawing
      if (isDrawing) {
        e.preventDefault();
      }
      endGesture();
    };

    const md = (e: MouseEvent) => {
      // Allow interactive elements to function normally
      if (isInteractiveElement(e.target)) return;
      
      e.preventDefault();
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
      
      e.preventDefault();
      endGesture();
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
  }, [containerRef, getEventPosition, startGesture, addPoint, endGesture, isDrawing, isInteractiveElement, points]);

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
        touchAction: 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    />
  );
};

export default GestureOverlay;