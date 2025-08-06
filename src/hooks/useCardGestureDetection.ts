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
    const minPoints = isMobile ? 8 : 10; // Much more lenient
    
    if (gesturePoints.length < minPoints) {
      console.log(`Not enough points: ${gesturePoints.length}/${minPoints}`);
      return false;
    }
    
    console.log(`🔍 Analyzing A gesture with ${gesturePoints.length} points (mobile: ${isMobile})`);
    console.log('First point:', gesturePoints[0]);
    console.log('Last point:', gesturePoints[gesturePoints.length - 1]);
    
    // Find the highest point (peak of the "A") - allow peak anywhere in middle 70%
    let peakIndex = 0;
    let peakY = gesturePoints[0].y;
    
    const searchStart = Math.floor(gesturePoints.length * 0.15);
    const searchEnd = Math.floor(gesturePoints.length * 0.85);
    
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
    
    // Much more lenient height requirements
    const minHeight = isMobile ? 15 : 20;
    const minWidth = isMobile ? 20 : 30;
    
    console.log(`📏 Heights - Left: ${leftHeight}, Right: ${rightHeight} (min: ${minHeight})`);
    
    if (leftHeight < minHeight || rightHeight < minHeight) {
      console.log('❌ Insufficient height on sides');
      return false;
    }
    
    // Check horizontal spread
    const totalWidth = Math.abs(lastPoint.x - firstPoint.x);
    console.log(`📏 Total width: ${totalWidth} (min: ${minWidth})`);
    
    if (totalWidth < minWidth) {
      console.log('❌ Gesture too narrow');
      return false;
    }
    
    // DRAMATICALLY SIMPLIFIED CROSSBAR DETECTION
    // Look for ANY horizontal movement in the middle portion
    let foundCrossbar = false;
    let bestHorizontalSegment = 0;
    
    const middleStart = Math.floor(gesturePoints.length * 0.25);
    const middleEnd = Math.floor(gesturePoints.length * 0.75);
    
    console.log(`🔍 Looking for crossbar between indices ${middleStart}-${middleEnd}`);
    
    for (let i = middleStart; i < middleEnd - 3; i++) {
      for (let segmentSize = 3; segmentSize <= 8 && i + segmentSize < middleEnd; segmentSize++) {
        const segment = gesturePoints.slice(i, i + segmentSize);
        const startPoint = segment[0];
        const endPoint = segment[segment.length - 1];
        
        const horizontalDistance = Math.abs(endPoint.x - startPoint.x);
        const verticalDistance = Math.abs(endPoint.y - startPoint.y);
        
        // Super lenient crossbar detection - just needs some horizontal movement
        const minHorizontal = isMobile ? 8 : 10;
        
        if (horizontalDistance > minHorizontal && horizontalDistance > verticalDistance * 0.8) {
          bestHorizontalSegment = Math.max(bestHorizontalSegment, horizontalDistance);
          
          // Check if roughly in the middle height of the A
          const segmentAvgY = segment.reduce((sum, p) => sum + p.y, 0) / segment.length;
          const expectedCrossbarY = peakPoint.y + (Math.max(firstPoint.y, lastPoint.y) - peakPoint.y) * 0.6;
          
          // Very generous positioning tolerance
          const tolerance = isMobile ? 80 : 60;
          
          console.log(`📊 Segment at ${i}: horizontal=${horizontalDistance}, vertical=${verticalDistance}, avgY=${segmentAvgY}, expectedY=${expectedCrossbarY}`);
          
          if (Math.abs(segmentAvgY - expectedCrossbarY) < tolerance) {
            foundCrossbar = true;
            console.log('✅ Crossbar detected!');
            break;
          }
        }
      }
      if (foundCrossbar) break;
    }
    
    console.log(`📊 Best horizontal segment: ${bestHorizontalSegment}`);
    
    // Fallback: if we have decent horizontal movement anywhere, accept it
    if (!foundCrossbar && bestHorizontalSegment > (isMobile ? 15 : 20)) {
      console.log('✅ Fallback crossbar accepted based on horizontal movement');
      foundCrossbar = true;
    }
    
    if (!foundCrossbar) {
      console.log('❌ No crossbar detected');
      return false;
    }
    
    // Very lenient slope check - just ensure general A shape
    const leftSlope = (peakPoint.y - firstPoint.y) / Math.max(Math.abs(peakPoint.x - firstPoint.x), 1);
    const rightSlope = (lastPoint.y - peakPoint.y) / Math.max(Math.abs(lastPoint.x - peakPoint.x), 1);
    
    console.log(`📈 Slopes - Left: ${leftSlope}, Right: ${rightSlope}`);
    
    // Much more lenient slope requirements
    if (leftSlope > 0.1 || rightSlope < -0.1) {
      console.log('❌ Invalid slopes - not A-like shape');
      return false;
    }
    
    console.log('🎉 Valid "A" shape detected!');
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