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
    const isMobile = 'ontouchstart' in window;
    const minPoints = isMobile ? 12 : 15;
    
    if (gesturePoints.length < minPoints) {
      console.log(`Not enough points: ${gesturePoints.length}/${minPoints}`);
      return false;
    }
    
    console.log(`🔍 Analyzing A gesture with ${gesturePoints.length} points (mobile: ${isMobile})`);
    
    // STEP 1: Validate basic A shape structure first
    
    // Find the highest point (peak of the "A") in middle portion
    let peakIndex = 0;
    let peakY = gesturePoints[0].y;
    
    const searchStart = Math.floor(gesturePoints.length * 0.15);
    const searchEnd = Math.floor(gesturePoints.length * 0.6); // Look earlier for peak
    
    for (let i = searchStart; i < searchEnd; i++) {
      if (gesturePoints[i].y < peakY) {
        peakY = gesturePoints[i].y;
        peakIndex = i;
      }
    }
    
    console.log(`📍 Peak found at index ${peakIndex}, Y: ${peakY}`);
    
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    const peakPoint = gesturePoints[peakIndex];
    
    // Check for basic "A" shape: goes up to peak, then down
    const leftHeight = firstPoint.y - peakPoint.y;
    const rightHeight = lastPoint.y - peakPoint.y;
    
    const minHeight = isMobile ? 20 : 25;
    const minWidth = isMobile ? 25 : 35;
    
    console.log(`📏 Heights - Left: ${leftHeight}, Right: ${rightHeight} (min: ${minHeight})`);
    
    if (leftHeight < minHeight || rightHeight < minHeight) {
      console.log('❌ Insufficient height - not an A shape');
      return false;
    }
    
    // Check horizontal spread
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    console.log(`📏 Total width: ${totalWidth} (min: ${minWidth})`);
    
    if (totalWidth < minWidth) {
      console.log('❌ Gesture too narrow');
      return false;
    }
    
    // Check slopes to ensure A-like shape
    const leftSlope = (peakPoint.y - firstPoint.y) / Math.max(Math.abs(peakPoint.x - firstPoint.x), 1);
    const rightSlope = (lastPoint.y - peakPoint.y) / Math.max(Math.abs(lastPoint.x - peakPoint.x), 1);
    
    console.log(`📈 Slopes - Left: ${leftSlope}, Right: ${rightSlope}`);
    
    if (leftSlope > 0.1 || rightSlope < -0.1) {
      console.log('❌ Invalid slopes - not A-like shape');
      return false;
    }
    
    console.log('✅ Basic A shape validated');
    
    // STEP 2: Now look for ANY horizontal movement after the A shape is established
    // Look from after the peak to the end for any horizontal crossbar
    const crossbarSearchStart = peakIndex + 3;
    let foundCrossbar = false;
    
    console.log(`🔍 Looking for crossbar from index ${crossbarSearchStart} onwards`);
    
    for (let i = crossbarSearchStart; i < gesturePoints.length - 3; i++) {
      // Check small segments for horizontal movement
      for (let segmentSize = 3; segmentSize <= 6 && i + segmentSize < gesturePoints.length; segmentSize++) {
        const segment = gesturePoints.slice(i, i + segmentSize);
        const startPoint = segment[0];
        const endPoint = segment[segment.length - 1];
        
        const horizontalDistance = Math.abs(endPoint.x - startPoint.x);
        const verticalDistance = Math.abs(endPoint.y - startPoint.y);
        
        // ANY decent horizontal movement counts
        const minHorizontal = isMobile ? 10 : 12;
        
        if (horizontalDistance > minHorizontal && horizontalDistance > verticalDistance) {
          console.log(`✅ Crossbar detected at segment ${i}-${i + segmentSize}: horizontal=${horizontalDistance}, vertical=${verticalDistance}`);
          foundCrossbar = true;
          break;
        }
      }
      if (foundCrossbar) break;
    }
    
    if (!foundCrossbar) {
      console.log('❌ No crossbar detected - A shape incomplete');
      return false;
    }
    
    console.log('🎉 Complete "A" shape with crossbar detected!');
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