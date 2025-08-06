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
    if (gesturePoints.length < 30) return false; // Require substantial gesture for "A"

    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    
    // Must start in upper portion and end in lower portion
    const screenHeight = window.innerHeight;
    if (firstPoint.y > screenHeight * 0.3) return false; // Start in upper 30%
    if (lastPoint.y < screenHeight * 0.6) return false; // End in lower 40%
    
    // Split gesture into three parts for "A" shape analysis
    const firstThird = Math.floor(gesturePoints.length * 0.33);
    const secondThird = Math.floor(gesturePoints.length * 0.66);
    
    const leftStroke = gesturePoints.slice(0, firstThird);
    const crossBar = gesturePoints.slice(firstThird, secondThird);
    const rightStroke = gesturePoints.slice(secondThird);
    
    if (leftStroke.length < 8 || crossBar.length < 6 || rightStroke.length < 8) return false;
    
    // Check left stroke - should go up and right (first part of A)
    const leftStart = leftStroke[0];
    const leftEnd = leftStroke[leftStroke.length - 1];
    const leftDeltaX = leftEnd.x - leftStart.x;
    const leftDeltaY = leftEnd.y - leftStart.y;
    
    // Left stroke should move up and right
    if (leftDeltaY > 0) return false; // Should move up (negative Y)
    if (leftDeltaX < 50) return false; // Should move right significantly
    
    // Check crossbar - should be roughly horizontal
    const crossStart = crossBar[0];
    const crossEnd = crossBar[crossBar.length - 1];
    const crossDeltaX = crossEnd.x - crossStart.x;
    const crossDeltaY = Math.abs(crossEnd.y - crossStart.y);
    
    if (crossDeltaX < 30) return false; // Must move horizontally
    if (crossDeltaY > crossDeltaX * 0.5) return false; // Should be mostly horizontal
    
    // Check right stroke - should go down and right (completing the A)
    const rightStart = rightStroke[0];
    const rightEnd = rightStroke[rightStroke.length - 1];
    const rightDeltaX = rightEnd.x - rightStart.x;
    const rightDeltaY = rightEnd.y - rightStart.y;
    
    // Right stroke should move down and right
    if (rightDeltaY < 50) return false; // Should move down significantly
    if (rightDeltaX < 20) return false; // Should move right
    
    // Validate overall A shape - peak should be higher than endpoints
    const peakY = Math.min(...gesturePoints.slice(0, firstThird * 2).map(p => p.y));
    if (peakY > firstPoint.y - 50) return false; // Peak should be significantly higher
    
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - only validate on substantial gestures
      if (updated.length > 30 && isValidAShape(updated)) {
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