import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePongGame } from '@/hooks/usePongGame';
import { usePongHighScores } from '@/hooks/usePongHighScores';

interface PongGameProps {
  onClose: () => void;
}

const PongGame = ({ onClose }: PongGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHighScores, setShowHighScores] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const {
    gameState,
    score,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    updatePaddlePosition
  } = usePongGame(canvasRef);

  const { 
    highScores, 
    submitScore, 
    loading: scoresLoading 
  } = usePongHighScores();

  // Handle mouse movement for paddle control
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    updatePaddlePosition(y);
  }, [updatePaddlePosition]);

  // Handle touch movement for mobile
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.touches[0].clientY - rect.top;
    updatePaddlePosition(y);
  }, [updatePaddlePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  // Handle game over
  useEffect(() => {
    if (gameOver && score > 0) {
      submitScore(score);
    }
  }, [gameOver, score, submitScore]);

  const handleStartGame = () => {
    setGameStarted(true);
    setShowHighScores(false);
    startGame();
  };

  const handleShowHighScores = () => {
    setShowHighScores(true);
  };

  const handlePlayAgain = () => {
    resetGame();
    setGameStarted(true);
    setShowHighScores(false);
    startGame();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border border-white"
        style={{ maxWidth: '90vw', maxHeight: '70vh' }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white hover:bg-white/10 pointer-events-auto"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Score display */}
        {gameStarted && (
          <div className="absolute top-4 left-4 text-white font-mono text-2xl">
            Score: {score}
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && !showHighScores && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-mono mb-8 tracking-wider">PONG</h1>
            <div className="space-y-4">
              <Button
                onClick={handleStartGame}
                className="bg-white text-black hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
              >
                START GAME
              </Button>
              <Button
                onClick={handleShowHighScores}
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-mono px-8 py-3 pointer-events-auto"
              >
                <Trophy className="h-4 w-4 mr-2" />
                HIGH SCORES
              </Button>
            </div>
            <p className="text-sm mt-8 opacity-70 font-mono">
              Move your mouse to control the left paddle
            </p>
          </div>
        )}

        {/* High scores screen */}
        {showHighScores && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-mono mb-8 tracking-wider">HIGH SCORES</h2>
            <div className="bg-black/50 border border-white p-6 min-w-[300px]">
              {scoresLoading ? (
                <div className="text-center font-mono">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {highScores.slice(0, 10).map((score, index) => (
                    <div key={score.id} className="flex justify-between font-mono text-sm">
                      <span>{index + 1}. {score.player_name}</span>
                      <span>{score.score}</span>
                    </div>
                  ))}
                  {highScores.length === 0 && (
                    <div className="text-center font-mono text-sm opacity-70">
                      No scores yet. Be the first!
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowHighScores(false)}
              variant="outline"
              className="border-white text-white hover:bg-white/10 font-mono px-8 py-3 mt-6 pointer-events-auto"
            >
              BACK
            </Button>
          </div>
        )}

        {/* Game over screen */}
        {gameOver && gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80">
            <h2 className="text-3xl font-mono mb-4 tracking-wider">GAME OVER</h2>
            <p className="text-xl font-mono mb-8">Final Score: {score}</p>
            <div className="space-y-4">
              <Button
                onClick={handlePlayAgain}
                className="bg-white text-black hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                PLAY AGAIN
              </Button>
              <Button
                onClick={handleShowHighScores}
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-mono px-8 py-3 pointer-events-auto"
              >
                <Trophy className="h-4 w-4 mr-2" />
                HIGH SCORES
              </Button>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {!gameRunning && gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
            <div className="text-center">
              <p className="text-2xl font-mono mb-4">PAUSED</p>
              <Button
                onClick={startGame}
                className="bg-white text-black hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
              >
                RESUME
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PongGame;