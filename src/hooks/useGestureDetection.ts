import { useState, useRef, useCallback, useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

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
  const attemptStartTime = useRef<number | null>(null);
  const { trackSecretGesture } = useAnalytics();

  const clearGesture = useCallback(() => {
    setPoints([]);
    setIsDrawing(false);
    setIsComplete(false);
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
  }, []);

  const isValid7Shape = useCallback((gesturePoints: Point[]): boolean => {
    // Require enough data points to form two segments
    if (gesturePoints.length < 12) return false;

    // Thresholds for a "decent size" 7 gesture (in px)
    const H_MIN = 70;   // min horizontal length for the top bar
    const V_MIN = 80;   // min vertical drop for the diagonal
    const D_MIN = 30;   // min horizontal change during diagonal
    const SLOPE_MIN = 0.6; // vertical/horizontal ratio for diagonal (steep enough)

    // 1) Detect a predominantly horizontal start segment
    let horizontalAccum = 0;
    let verticalDrift = 0;
    let splitIndex = 1; // index where horizontal ends and diagonal begins

    for (let i = 1; i < gesturePoints.length; i++) {
      const prev = gesturePoints[i - 1];
      const curr = gesturePoints[i];
      horizontalAccum += Math.abs(curr.x - prev.x);
      verticalDrift += Math.abs(curr.y - prev.y);

      // once we have enough horizontal travel, mark the split
      if (horizontalAccum >= H_MIN) {
        splitIndex = i;
        break;
      }

      // avoid scanning forever: cap horizontal scan to first 40% of the path
      if (i > Math.floor(gesturePoints.length * 0.4)) break;
    }

    const hasHorizontalStart = horizontalAccum >= H_MIN && verticalDrift <= Math.max(20, horizontalAccum * 0.4);
    if (!hasHorizontalStart) {
      // Must start with a clear horizontal line
      return false;
    }

    // 2) Analyze the diagonal downward segment after the split
    const diagonal = gesturePoints.slice(splitIndex);
    if (diagonal.length < 5) return false;

    const diagStart = diagonal[0];
    const diagEnd = diagonal[diagonal.length - 1];
    const dx = diagEnd.x - diagStart.x;
    const dy = diagEnd.y - diagStart.y; // down is positive

    const verticalDownEnough = dy >= V_MIN; // must go down a decent amount
    const horizontalEnough = Math.abs(dx) >= D_MIN; // some horizontal change (either direction)
    const slopeOk = Math.abs(dy) / Math.max(1, Math.abs(dx)) >= SLOPE_MIN; // diagonal, not flat

    if (!(verticalDownEnough && horizontalEnough && slopeOk)) {
      return false;
    }

    // All checks passed → looks like a "7": top bar then downward diagonal
    return true;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = { x, y, timestamp: Date.now() };
    setPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Check if gesture is complete - validate for 7 shape
      if (updated.length > 10 && isValid7Shape(updated)) {
        const duration = attemptStartTime.current ? Date.now() - attemptStartTime.current : 0;
        
        setIsComplete(true);
        setIsDrawing(false);
        
        // Track successful gesture completion
        trackSecretGesture('complete', 'seven_gesture', {
          points: updated,
          duration,
          accuracy: calculateGestureAccuracy(updated)
        });
        
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
    attemptStartTime.current = Date.now();
    
    // Track gesture attempt
    trackSecretGesture('attempt', 'seven_gesture', {
      points: [{ x, y, timestamp: Date.now() }]
    });
    
    // Set timeout to clear gesture if not completed
    gestureTimeoutRef.current = setTimeout(() => {
      clearGesture();
    }, 8000);
  }, [addPoint, clearGesture, trackSecretGesture]);

  const endGesture = useCallback(() => {
    if (isDrawing && !isComplete) {
      const duration = attemptStartTime.current ? Date.now() - attemptStartTime.current : 0;
      
      // Track failed gesture attempt
      trackSecretGesture('failed', 'seven_gesture', {
        points,
        duration,
        accuracy: calculateGestureAccuracy(points)
      });
    }
    
    setIsDrawing(false);
    
    // Clear gesture after a delay if not completed
    if (!isComplete) {
      setTimeout(() => {
        clearGesture();
      }, 500);
    }
  }, [isComplete, clearGesture, isDrawing, points, trackSecretGesture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);

  // Calculate gesture accuracy based on how close the path is to an ideal "7" shape
  const calculateGestureAccuracy = useCallback((gesturePoints: Point[]): number => {
    if (gesturePoints.length < 3) return 0;
    
    // Simple accuracy calculation based on path deviation
    // This is a basic implementation - you could make it more sophisticated
    const totalPoints = gesturePoints.length;
    const idealRatio = 0.7; // Rough ratio for a good "7" shape
    
    // Calculate horizontal vs vertical movement ratio
    const firstPoint = gesturePoints[0];
    const lastPoint = gesturePoints[gesturePoints.length - 1];
    const horizontalMovement = Math.abs(lastPoint.x - firstPoint.x);
    const verticalMovement = Math.abs(lastPoint.y - firstPoint.y);
    
    const actualRatio = horizontalMovement / (horizontalMovement + verticalMovement);
    const deviation = Math.abs(actualRatio - idealRatio);
    
    return Math.max(0, 1 - deviation * 2); // Return accuracy between 0 and 1
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