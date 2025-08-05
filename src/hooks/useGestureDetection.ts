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

  const isValidSShape = useCallback((gesturePoints: Point[]): boolean => {
    if (gesturePoints.length < 10) return false;

    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    
    // Check if gesture moves generally from top to bottom
    const verticalMovement = lastPoint.y - firstPoint.y;
    if (verticalMovement < 50) return false; // Minimum vertical distance
    
    // Check for S-like curves by analyzing direction changes
    let directionChanges = 0;
    let lastDirection = '';
    
    for (let i = 1; i < gesturePoints.length - 1; i++) {
      const prev = gesturePoints[i - 1];
      const curr = gesturePoints[i];
      const next = gesturePoints[i + 1];
      
      const deltaX1 = curr.x - prev.x;
      const deltaX2 = next.x - curr.x;
      
      const currentDirection = deltaX2 > deltaX1 ? 'right' : 'left';
      
      if (lastDirection && lastDirection !== currentDirection) {
        directionChanges++;
      }
      lastDirection = currentDirection;
    }
    
    // S shape should have 2-3 direction changes
    return directionChanges >= 2 && directionChanges <= 4;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete
      if (updated.length > 10 && isValidSShape(updated)) {
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
  }, [isValidSShape, onGestureComplete, clearGesture]);

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