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
    if (gesturePoints.length < 25) return false; // Require more points for complete S

    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    
    // Check if gesture moves generally from top to bottom with significant distance
    const verticalMovement = lastPoint.y - firstPoint.y;
    if (verticalMovement < 150) return false; // Require larger vertical movement
    
    // Check horizontal span - S should move left and right significantly
    const allXs = gesturePoints.map(p => p.x);
    const minX = Math.min(...allXs);
    const maxX = Math.max(...allXs);
    const horizontalSpan = maxX - minX;
    if (horizontalSpan < 80) return false; // Require significant horizontal movement
    
    // Divide the gesture into three vertical sections to check S pattern
    const section1End = Math.floor(gesturePoints.length * 0.33);
    const section2End = Math.floor(gesturePoints.length * 0.66);
    
    const section1Points = gesturePoints.slice(0, section1End);
    const section2Points = gesturePoints.slice(section1End, section2End);
    const section3Points = gesturePoints.slice(section2End);
    
    // Check each section has movement in expected direction
    const section1Movement = section1Points[section1Points.length - 1].x - section1Points[0].x;
    const section2Movement = section2Points[section2Points.length - 1].x - section2Points[0].x;
    const section3Movement = section3Points[section3Points.length - 1].x - section3Points[0].x;
    
    // S pattern: first section curves one way, middle curves back, final curves original way
    // Allow for some tolerance but require clear direction changes
    const hasProperSCurves = (
      Math.abs(section1Movement) > 20 && 
      Math.abs(section2Movement) > 20 && 
      Math.abs(section3Movement) > 20 &&
      ((section1Movement > 0 && section2Movement < 0 && section3Movement > 0) ||
       (section1Movement < 0 && section2Movement > 0 && section3Movement < 0))
    );
    
    return hasProperSCurves;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - only validate on longer gestures
      if (updated.length > 25 && isValidSShape(updated)) {
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