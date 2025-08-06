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

  const isValidAShape = useCallback((gesturePoints: Point[]): boolean => {
    if (gesturePoints.length < 15) return false; // Reduced minimum points
    
    console.log(`Analyzing gesture with ${gesturePoints.length} points`);
    
    // Find the highest point (peak of the "A")
    let peakIndex = 0;
    let peakY = gesturePoints[0].y;
    
    for (let i = 1; i < gesturePoints.length; i++) {
      if (gesturePoints[i].y < peakY) {
        peakY = gesturePoints[i].y;
        peakIndex = i;
      }
    }
    
    // Need a clear peak (not at the very start or end)
    if (peakIndex < 3 || peakIndex > gesturePoints.length - 4) {
      console.log('No clear peak found');
      return false;
    }
    
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    const peakPoint = gesturePoints[peakIndex];
    
    // Check for basic "A" shape: goes up to peak, then down
    const leftHeight = firstPoint.y - peakPoint.y;
    const rightHeight = lastPoint.y - peakPoint.y;
    
    // Both sides should have some height
    if (leftHeight < 30 || rightHeight < 30) {
      console.log('Insufficient height on sides');
      return false;
    }
    
    // Check horizontal spread
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    if (totalWidth < 50) {
      console.log('Gesture too narrow');
      return false;
    }
    
    // Simple directional check: should go generally up then down
    const leftSlope = (peakPoint.y - firstPoint.y) / (peakPoint.x - firstPoint.x);
    const rightSlope = (lastPoint.y - peakPoint.y) / (lastPoint.x - peakPoint.x);
    
    // Left side should go up (negative slope), right side should go down (positive slope)
    if (leftSlope > -0.3 || rightSlope < 0.3) {
      console.log('Invalid slopes');
      return false;
    }
    
    console.log('Valid "A" shape detected!');
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - validate more frequently
      if (updated.length > 15 && isValidAShape(updated)) {
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
  }, [isValidAShape, onGestureComplete, clearGesture]);

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