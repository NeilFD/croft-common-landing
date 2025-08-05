import React, { useRef, useCallback } from 'react';
import useGestureDetection from '@/hooks/useGestureDetection';
import GestureTrail from './GestureTrail';

interface GestureOverlayProps {
  onGestureComplete: () => void;
}

const GestureOverlay: React.FC<GestureOverlayProps> = ({ onGestureComplete }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const {
    isDrawing,
    points,
    isComplete,
    startGesture,
    addPoint,
    endGesture
  } = useGestureDetection(onGestureComplete);

  const getEventPosition = useCallback((event: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
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
  }, []);

  // Touch events (mobile)
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    endGesture();
  }, [endGesture]);

  // Mouse events (desktop)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    endGesture();
  }, [endGesture]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-transparent cursor-crosshair"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ touchAction: 'none' }}
      />
      <GestureTrail 
        points={points} 
        isComplete={isComplete} 
        isDrawing={isDrawing} 
      />
    </>
  );
};

export default GestureOverlay;