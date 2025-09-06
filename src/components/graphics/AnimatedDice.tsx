import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import SolidDice from "./SolidDice";

interface AnimatedDiceProps {
  className?: string;
  pairIndex: 0 | 1; // 0 for left dice, 1 for right dice
  animationDelay?: number;
}

// Lucky No 7 combinations: [left dice, right dice]
const LUCKY_SEVEN_PAIRS: Array<[1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6]> = [
  [1, 6],
  [2, 5], 
  [3, 4],
  [4, 3],
  [5, 2],
  [6, 1]
];

const AnimatedDice: React.FC<AnimatedDiceProps> = ({ 
  className, 
  pairIndex,
  animationDelay = 0
}) => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const currentFace = LUCKY_SEVEN_PAIRS[currentPairIndex][pairIndex];

  useEffect(() => {
    // Steady interval with slight randomization to prevent predictable patterns
    const getInterval = () => 2500 + Math.random() * 400; // 2.5-2.9 seconds
    
    const cyclePair = () => {
      setCurrentPairIndex(prev => (prev + 1) % LUCKY_SEVEN_PAIRS.length);
    };

    // Initial delay
    const initialTimeout = setTimeout(() => {
      const interval = setInterval(cyclePair, getInterval());
      return () => clearInterval(interval);
    }, animationDelay);

    return () => clearTimeout(initialTimeout);
  }, [animationDelay]);

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