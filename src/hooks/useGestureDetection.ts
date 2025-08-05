import { useState, useRef, useCallback, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureDetectionResult {
  isDrawing: boolean;
  points: Point[];
  isComplete: boolean;
  trail: Point[];
}

const useGestureDetection = (onGestureComplete: () => void) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const gestureTimeoutRef = useRef<NodeJS.Timeout>();

  const clearGesture = useCallback(() => {
    setPoints([]);
    setIsDrawing(false);
    setIsComplete(false);
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
  }, []);

  const isValid7Shape = useCallback((gesturePoints: Point[]): boolean => {
    if (gesturePoints.length < 30) return false; // Require substantial gesture

    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    
    // Must start in upper third of screen and end in lower portion
    const screenHeight = window.innerHeight;
    if (firstPoint.y > screenHeight * 0.4) return false; // Start in upper 40%
    if (lastPoint.y < screenHeight * 0.6) return false; // End in lower 40%
    
    // Must move significantly right then down
    const totalHorizontalMovement = lastPoint.x - firstPoint.x;
    const totalVerticalMovement = lastPoint.y - firstPoint.y;
    if (totalVerticalMovement < 200) return false; // Significant downward movement
    
    // Divide gesture into two parts to check for 7 pattern
    const midPoint = Math.floor(gesturePoints.length * 0.4); // First 40% should be horizontal
    const horizontalSection = gesturePoints.slice(0, midPoint);
    const diagonalSection = gesturePoints.slice(midPoint);
    
    if (horizontalSection.length < 10 || diagonalSection.length < 15) return false;
    
    // Check horizontal section (top of 7) - should move primarily right
    const horizontalStart = horizontalSection[0];
    const horizontalEnd = horizontalSection[horizontalSection.length - 1];
    const horizontalX = horizontalEnd.x - horizontalStart.x;
    const horizontalY = Math.abs(horizontalEnd.y - horizontalStart.y);
    
    if (horizontalX < 100) return false; // Must move significantly right
    if (horizontalY > horizontalX * 0.3) return false; // Should be mostly horizontal (allow 30% vertical tolerance)
    
    // Check diagonal section (stroke of 7) - should move down and optionally left
    const diagonalStart = diagonalSection[0];
    const diagonalEnd = diagonalSection[diagonalSection.length - 1];
    const diagonalY = diagonalEnd.y - diagonalStart.y;
    const diagonalX = diagonalEnd.x - diagonalStart.x;
    
    if (diagonalY < 150) return false; // Must move significantly down
    
    // Diagonal should be steeper than 30 degrees (vertical movement > horizontal movement / 2)
    if (diagonalY < Math.abs(diagonalX) * 1.5) return false;
    
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - only validate on substantial gestures
      if (updated.length > 30 && isValid7Shape(updated)) {
        setIsComplete(true);
        setIsDrawing(false);
        onGestureComplete();
        
        // Clear after a short delay
        setTimeout(() => {
          clearGesture();
        }, 1000);
      }
      
      return updated;
    });
  }, [isValid7Shape, onGestureComplete, clearGesture]);

  const startGesture = useCallback((x: number, y: number) => {
    clearGesture();
    setIsDrawing(true);
    addPoint(x, y);
    
    // Set timeout to clear gesture if not completed
    gestureTimeoutRef.current = setTimeout(() => {
      clearGesture();
    }, 5000);
  }, [addPoint, clearGesture]);

  const endGesture = useCallback(() => {
    setIsDrawing(false);
    
    // Clear gesture after a delay if not completed
    if (!isComplete) {
      setTimeout(() => {
        clearGesture();
      }, 500);
    }
  }, [isComplete, clearGesture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);

  return {
    isDrawing,
    points,
    isComplete,
    startGesture,
    addPoint,
    endGesture,
    clearGesture
  };
};

export default useGestureDetection;