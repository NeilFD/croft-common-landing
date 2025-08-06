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
    if (gesturePoints.length < 18) return false; // Reduced minimum points for easier detection
    
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
    
    // More flexible peak positioning
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
    
    // Reduced height requirements for smaller card area
    if (leftHeight < 30 || rightHeight < 30) {
      console.log('Insufficient height on sides');
      return false;
    }
    
    // Check horizontal spread - reduced for card area
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    if (totalWidth < 50) {
      console.log('Gesture too narrow');
      return false;
    }
    
    // IMPROVED CROSSBAR DETECTION
    // Look for any horizontal movement in the middle 60% of the gesture
    const middleStart = Math.floor(gesturePoints.length * 0.2);
    const middleEnd = Math.floor(gesturePoints.length * 0.8);
    let foundCrossbar = false;
    
    for (let i = middleStart; i < middleEnd - 5; i++) {
      const segment = gesturePoints.slice(i, i + 6); // Smaller segments for flexibility
      
      if (segment.length < 3) continue;
      
      // Check if this segment is roughly horizontal
      const startPoint = segment[0];
      const endPoint = segment[segment.length - 1];
      const horizontalDistance = Math.abs(endPoint.x - startPoint.x);
      const verticalDistance = Math.abs(endPoint.y - startPoint.y);
      
      // More forgiving crossbar detection - just needs to be more horizontal than vertical
      if (horizontalDistance > 15 && horizontalDistance > verticalDistance * 1.5) {
        // Check if this segment is in the general middle area of the A
        const segmentAvgY = segment.reduce((sum, p) => sum + p.y, 0) / segment.length;
        const expectedCrossbarY = peakPoint.y + (firstPoint.y - peakPoint.y) * 0.5; // Middle of the A
        
        // More forgiving positioning - anywhere in the middle half
        if (Math.abs(segmentAvgY - expectedCrossbarY) < 50) {
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
    
    // More forgiving directional check
    const leftSlope = (peakPoint.y - firstPoint.y) / Math.max(Math.abs(peakPoint.x - firstPoint.x), 1);
    const rightSlope = (lastPoint.y - peakPoint.y) / Math.max(Math.abs(lastPoint.x - peakPoint.x), 1);
    
    // More lenient slope requirements
    if (leftSlope > -0.2 || rightSlope < 0.2) {
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
      
      // Check if gesture is complete - progressive validation for quicker recognition
      if (updated.length > 18 && isValidAShape(updated)) {
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