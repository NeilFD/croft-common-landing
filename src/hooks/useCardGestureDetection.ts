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

const useCardGestureDetection = (onGestureComplete: () => void) => {
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
    if (gesturePoints.length < 25) return false; // Increased minimum points for stricter detection
    
    console.log(`Analyzing A gesture with ${gesturePoints.length} points`);
    
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
    if (peakIndex < 5 || peakIndex > gesturePoints.length - 6) {
      console.log('No clear peak found');
      return false;
    }
    
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    const peakPoint = gesturePoints[peakIndex];
    
    // Check for basic "A" shape: goes up to peak, then down
    const leftHeight = firstPoint.y - peakPoint.y;
    const rightHeight = lastPoint.y - peakPoint.y;
    
    // Both sides should have significant height
    if (leftHeight < 50 || rightHeight < 50) {
      console.log('Insufficient height on sides');
      return false;
    }
    
    // Check horizontal spread
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    if (totalWidth < 80) {
      console.log('Gesture too narrow');
      return false;
    }
    
    // CROSSBAR DETECTION - This is the key addition
    // Look for a horizontal movement in the middle portion of the gesture
    const middleStart = Math.floor(gesturePoints.length * 0.3);
    const middleEnd = Math.floor(gesturePoints.length * 0.8);
    let foundCrossbar = false;
    
    for (let i = middleStart; i < middleEnd - 10; i++) {
      const segment = gesturePoints.slice(i, i + 10);
      
      // Check if this segment is roughly horizontal
      const startPoint = segment[0];
      const endPoint = segment[segment.length - 1];
      const horizontalDistance = Math.abs(endPoint.x - startPoint.x);
      const verticalDistance = Math.abs(endPoint.y - startPoint.y);
      
      // Crossbar should be more horizontal than vertical and have minimum length
      if (horizontalDistance > 20 && horizontalDistance > verticalDistance * 2) {
        // Check if this segment is roughly in the middle height of the A
        const segmentAvgY = segment.reduce((sum, p) => sum + p.y, 0) / segment.length;
        const expectedCrossbarY = peakPoint.y + (firstPoint.y - peakPoint.y) * 0.4; // 40% down from peak
        
        if (Math.abs(segmentAvgY - expectedCrossbarY) < 30) {
          foundCrossbar = true;
          console.log('Crossbar detected');
          break;
        }
      }
    }
    
    if (!foundCrossbar) {
      console.log('No crossbar detected');
      return false;
    }
    
    // Simple directional check: should go generally up then down
    const leftSlope = (peakPoint.y - firstPoint.y) / (peakPoint.x - firstPoint.x);
    const rightSlope = (lastPoint.y - peakPoint.y) / (lastPoint.x - peakPoint.x);
    
    // Left side should go up (negative slope), right side should go down (positive slope)
    if (leftSlope > -0.4 || rightSlope < 0.4) {
      console.log('Invalid slopes');
      return false;
    }
    
    console.log('Valid "A" shape with crossbar detected!');
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - validate less frequently for stricter detection
      if (updated.length > 25 && isValidAShape(updated)) {
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

export default useCardGestureDetection;