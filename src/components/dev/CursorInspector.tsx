import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface ElementInfo {
  tag: string;
  classes: string;
  id: string;
  zIndex: string;
  opacity: string;
  pointerEvents: string;
  cursor: string;
  position: string;
}

/**
 * CursorInspector - Dev utility to identify elements under cursor
 * Activated by ?debugclick=1 query parameter
 * Shows real-time badge with element info and highlights problematic elements
 */
export default function CursorInspector() {
  const [isActive, setIsActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Only activate if ?debugclick=1 is present
    const params = new URLSearchParams(window.location.search);
    setIsActive(params.has('debugclick'));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const isNative = Capacitor.isNativePlatform();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Get element stack at cursor position
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      const topElement = elementsAtPoint[0] as HTMLElement;
      
      if (!topElement) return;

      // Clear previous highlight
      if (highlightedElement && highlightedElement !== topElement) {
        highlightedElement.style.outline = '';
        highlightedElement.removeAttribute('data-cursor-debug');
      }

      const computedStyle = getComputedStyle(topElement);
      
      // Collect element info
      const info: ElementInfo = {
        tag: topElement.tagName.toLowerCase(),
        classes: topElement.className || '(none)',
        id: topElement.id || '(none)',
        zIndex: computedStyle.zIndex,
        opacity: computedStyle.opacity,
        pointerEvents: computedStyle.pointerEvents,
        cursor: computedStyle.cursor,
        position: computedStyle.position
      };

      setElementInfo(info);

      // Highlight element if it has suspicious properties (with native-aware thresholds)
      const opacityThreshold = isNative ? 0.15 : 0.1;
      const isSuspicious = (
        computedStyle.cursor === 'pointer' &&
        (parseFloat(computedStyle.opacity) < opacityThreshold ||
         computedStyle.visibility === 'hidden' ||
         (!topElement.onclick && 
          !topElement.getAttribute('href') && 
          !topElement.getAttribute('role')?.includes('button')))
      );

      if (isSuspicious) {
        topElement.style.outline = '2px dashed red';
        topElement.setAttribute('data-cursor-debug', 'suspicious');
        setHighlightedElement(topElement);
        console.warn(`[CursorInspector] Suspicious element (${isNative ? 'NATIVE' : 'DESKTOP'}):`, {
          element: topElement,
          ...info
        });
      } else if (highlightedElement === topElement) {
        topElement.style.outline = '';
        topElement.removeAttribute('data-cursor-debug');
        setHighlightedElement(null);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isNative || e.touches.length === 0) return;
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    // Add touch support for native platforms
    if (isNative) {
      document.addEventListener('touchstart', handleTouchStart);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (isNative) {
        document.removeEventListener('touchstart', handleTouchStart);
      }
      // Clean up any remaining highlights
      if (highlightedElement) {
        highlightedElement.style.outline = '';
        highlightedElement.removeAttribute('data-cursor-debug');
      }
    };
  }, [isActive, highlightedElement]);

  if (!isActive || !elementInfo) return null;

  return (
    <div
      className="fixed z-[100000] bg-black/90 text-white text-xs p-2 rounded shadow-lg pointer-events-none font-mono"
      style={{
        left: mousePos.x + 15,
        top: mousePos.y - 40,
        transform: mousePos.x > window.innerWidth - 300 ? 'translateX(-100%)' : undefined
      }}
    >
      <div className="font-bold text-yellow-300">{elementInfo.tag}</div>
      <div>classes: {elementInfo.classes.substring(0, 40)}{elementInfo.classes.length > 40 ? '...' : ''}</div>
      <div>cursor: <span className={elementInfo.cursor === 'pointer' ? 'text-red-300' : 'text-green-300'}>{elementInfo.cursor}</span></div>
      <div>opacity: <span className={parseFloat(elementInfo.opacity) < 0.1 ? 'text-red-300' : 'text-green-300'}>{elementInfo.opacity}</span></div>
      <div>pointer-events: <span className={elementInfo.pointerEvents === 'none' ? 'text-green-300' : 'text-yellow-300'}>{elementInfo.pointerEvents}</span></div>
      <div>z-index: {elementInfo.zIndex}</div>
      <div>position: {elementInfo.position}</div>
    </div>
  );
}