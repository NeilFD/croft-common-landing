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
    // Further reduced for mobile devices - detection based on device
    const isMobile = 'ontouchstart' in window;
    const minPoints = isMobile ? 12 : 15;
    
    if (gesturePoints.length < minPoints) return false;
    
    console.log(`Analyzing A gesture with ${gesturePoints.length} points (mobile: ${isMobile})`);
    
    // Find the highest point (peak of the "A")
    let peakIndex = 0;
    let peakY = gesturePoints[0].y;
    
    for (let i = 1; i < gesturePoints.length; i++) {
      if (gesturePoints[i].y < peakY) {
        peakY = gesturePoints[i].y;
        peakIndex = i;
      }
    }
    
    // Even more flexible peak positioning for mobile
    const peakBuffer = isMobile ? 2 : 3;
    if (peakIndex < peakBuffer || peakIndex > gesturePoints.length - (peakBuffer + 1)) {
      console.log('No clear peak found');
      return false;
    }
    
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    const peakPoint = gesturePoints[peakIndex];
    
    // Check for basic "A" shape: goes up to peak, then down
    const leftHeight = firstPoint.y - peakPoint.y;
    const rightHeight = lastPoint.y - peakPoint.y;
    
    // Device-specific requirements
    const minHeight = isMobile ? 20 : 25;
    const minWidth = isMobile ? 30 : 40;
    
    if (leftHeight < minHeight || rightHeight < minHeight) {
      console.log('Insufficient height on sides');
      return false;
    }
    
    // Check horizontal spread - further reduced for mobile touch
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    if (totalWidth < minWidth) {
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
      
      // Even more forgiving crossbar detection for mobile
      const minHorizontal = isMobile ? 10 : 12;
      const crossbarRatio = isMobile ? 1.2 : 1.4;
      
      if (horizontalDistance > minHorizontal && horizontalDistance > verticalDistance * crossbarRatio) {
        // Check if this segment is in the general middle area of the A
        const segmentAvgY = segment.reduce((sum, p) => sum + p.y, 0) / segment.length;
        const expectedCrossbarY = peakPoint.y + (firstPoint.y - peakPoint.y) * 0.5; // Middle of the A
        
        // Very forgiving positioning for mobile touch
        const tolerance = isMobile ? 60 : 45;
        if (Math.abs(segmentAvgY - expectedCrossbarY) < tolerance) {
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
      
      // Progressive validation with device-specific thresholds
      const isMobile = 'ontouchstart' in window;
      const validationThreshold = isMobile ? 12 : 15;
      
      if (updated.length > validationThreshold && isValidAShape(updated)) {
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