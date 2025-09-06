import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import SolidDice from "./SolidDice";

interface AnimatedDiceProps {
  className?: string;
  initialFace?: 1 | 2 | 3 | 4 | 5 | 6;
  animationDelay?: number;
}

const AnimatedDice: React.FC<AnimatedDiceProps> = ({ 
  className, 
  initialFace = 1,
  animationDelay = 0
}) => {
  const [currentFace, setCurrentFace] = useState<1 | 2 | 3 | 4 | 5 | 6>(initialFace);

  useEffect(() => {
    // Random interval between 800ms and 1200ms to prevent screenshot timing
    const getRandomInterval = () => Math.random() * 400 + 800;
    
    const changeface = () => {
      // Get a random face different from current one
      const faces: Array<1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6];
      const otherFaces = faces.filter(f => f !== currentFace);
      const newFace = otherFaces[Math.floor(Math.random() * otherFaces.length)];
      setCurrentFace(newFace);
    };

    // Initial delay
    const initialTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        changeface();
      }, getRandomInterval());

      return () => clearInterval(interval);
    }, animationDelay);

    return () => clearTimeout(initialTimeout);
  }, [currentFace, animationDelay]);

  return (
    <div className={cn("anti-screenshot-dice", className)}>
      <SolidDice 
        face={currentFace} 
        className="w-24 h-24 transition-all duration-300 ease-in-out"
      />
    </div>
  );
};

export default AnimatedDice;