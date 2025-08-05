import React from 'react';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureTrailProps {
  points: Point[];
  isComplete: boolean;
  isDrawing: boolean;
}

const GestureTrail: React.FC<GestureTrailProps> = ({ points, isComplete, isDrawing }) => {
  if (points.length < 2) return null;

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  const strokeColor = isComplete ? '#10b981' : isDrawing ? '#3b82f6' : '#6b7280';
  const strokeWidth = isComplete ? 6 : 4;

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-30"
      style={{ width: '100vw', height: '100vh' }}
    >
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isComplete ? 0.8 : 0.6}
        className={`transition-all duration-300 ${isComplete ? 'animate-pulse' : ''}`}
      />
      
      {/* Add dots at key points */}
      {points.length > 0 && (
        <>
          {/* Start point */}
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r="8"
            fill={strokeColor}
            opacity="0.8"
          />
          
          {/* End point */}
          {points.length > 1 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="6"
              fill={strokeColor}
              opacity="0.6"
            />
          )}
        </>
      )}
    </svg>
  );
};

export default GestureTrail;