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
    if (gesturePoints.length < 10) return false;
    
    console.log(`Analyzing 7 gesture with ${gesturePoints.length} points`);
    
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    
    // Check if we have a generally downward motion (7 shape)
    const totalVerticalMovement = lastPoint.y - firstPoint.y;
    const totalHorizontalMovement = Math.abs(lastPoint.x - firstPoint.x);
    
    // Should move more vertically than horizontally for a "7"
    if (totalVerticalMovement < 30 || totalHorizontalMovement > totalVerticalMovement) {
      console.log('Not a valid 7 shape - insufficient vertical movement');
      return false;
    }
    
    // Look for a horizontal segment at the beginning (top of the 7)
    const firstQuarter = Math.floor(gesturePoints.length * 0.25);
    let hasHorizontalStart = false;
    
    if (firstQuarter > 3) {
      const startSegment = gesturePoints.slice(0, firstQuarter);
      const horizontalMovement = Math.abs(startSegment[startSegment.length - 1].x - startSegment[0].x);
      const verticalMovement = Math.abs(startSegment[startSegment.length - 1].y - startSegment[0].y);
      
      if (horizontalMovement > 20 && horizontalMovement > verticalMovement * 0.8) {
        hasHorizontalStart = true;
      }
    }
    
    // Check for downward diagonal movement in the latter part
    const lastHalf = gesturePoints.slice(Math.floor(gesturePoints.length * 0.3));
    if (lastHalf.length > 5) {
      const diagonalVertical = lastHalf[lastHalf.length - 1].y - lastHalf[0].y;
      if (diagonalVertical < 25) {
        console.log('Not enough downward diagonal movement');
        return false;
      }
    }
    
    console.log('Valid "7" shape detected!');
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - validate for 7 shape
      if (updated.length > 10 && isValid7Shape(updated)) {
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
    }, 8000);
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