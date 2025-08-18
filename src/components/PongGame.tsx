import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trophy, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePongGame } from '@/hooks/usePongGame';
import { usePongHighScores } from '@/hooks/usePongHighScores';
import CroftLogo from './CroftLogo';
import AnonymousNameModal from './AnonymousNameModal';

interface PongGameProps {
  onClose: () => void;
}

const PongGame = ({ onClose }: PongGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHighScores, setShowHighScores] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [initialHighScore, setInitialHighScore] = useState<number | null>(null);
  const [showRecordCelebration, setShowRecordCelebration] = useState(false);
  const [showNewHighScoreSet, setShowNewHighScoreSet] = useState(false);
  const audioRef = useRef<HTMLAudioElement>();
  
  const {
    score,
    speedLevel,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    updatePaddlePosition,
    playSound,
    toggleMute,
    playGameOverMusic
  } = usePongGame(canvasRef);

  const { 
    highScores, 
    submitScore,
    requestAnonymousScore,
    loading: scoresLoading,
    isAuthenticated
  } = usePongHighScores();

  // Get current high score for display and comparison
  const currentHighScore = highScores.length > 0 ? highScores[0].score : 0;

  // Audio is now handled by the comprehensive chiptune system in PongAudioManager

  const toggleAudio = () => {
    const newMutedState = toggleMute();
    setAudioEnabled(!newMutedState);
  };

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

  // Handle game over - submit score only once
  const scoreSubmittedRef = useRef(false);
  
  useEffect(() => {
    if (gameOver && score > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      playGameOverMusic();
      
      if (isAuthenticated) {
        submitScore(score);
      } else {
        setPendingScore(score);
        setShowAnonymousModal(true);
      }
    }
    
    // Reset flags when game starts
    if (gameRunning && !gameOver) {
      scoreSubmittedRef.current = false;
      setShowRecordCelebration(false);
      setShowNewHighScoreSet(false);
      
      // Set the initial high score threshold for this game session
      if (initialHighScore === null && currentHighScore > 0) {
        setInitialHighScore(currentHighScore);
      }
    }
  }, [gameOver, score, submitScore, gameRunning, isAuthenticated]);

  // Check for high score beating during gameplay - only when beating the initial record
  useEffect(() => {
    if (gameStarted && gameRunning && !gameOver && score > 0 && initialHighScore !== null) {
      if (score > initialHighScore && !showRecordCelebration) {
        setShowRecordCelebration(true);
        playSound('record_broken');
        
        // Hide celebration after 3 seconds
        setTimeout(() => {
          setShowRecordCelebration(false);
        }, 3000);
      }
    }
  }, [score, initialHighScore, showRecordCelebration, gameStarted, gameRunning, gameOver, playSound]);

  // Show "New High Score Set!" celebration at game over if we beat the initial record
  useEffect(() => {
    if (gameOver && score > 0 && initialHighScore !== null && score > initialHighScore) {
      setShowNewHighScoreSet(true);
      
      // Hide celebration after 4 seconds
      setTimeout(() => {
        setShowNewHighScoreSet(false);
      }, 4000);
    }
  }, [gameOver, score, initialHighScore]);

  const handleAnonymousScoreSubmit = async (playerName: string) => {
    if (pendingScore !== null) {
      await requestAnonymousScore(pendingScore, playerName);
      setPendingScore(null);
      setShowAnonymousModal(false);
    }
  };

  const handleAnonymousScoreCancel = () => {
    setPendingScore(null);
    setShowAnonymousModal(false);
  };

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
    setInitialHighScore(null); // Reset for new game session
    setShowNewHighScoreSet(false);
    startGame();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Header with branding */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-10">
        <CroftLogo size="sm" className="mb-2 invert" />
        <h1 className="text-xl font-mono tracking-wider">CROFT COMMON</h1>
        <p className="text-xs opacity-70 font-mono">RETRO ARCADE</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border border-white"
        style={{ maxWidth: '90vw', maxHeight: '70vh' }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
          <Button
            onClick={toggleAudio}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Score and level display */}
        {gameStarted && (
          <div className="absolute top-20 left-4 text-white font-mono space-y-2">
            <div className="text-2xl">Score: {score}</div>
            <div className="text-lg opacity-90 border border-white/30 px-2 py-1 rounded bg-black/30">
              High Score: {currentHighScore}
            </div>
            <div className="text-sm opacity-70">Speed Level: {speedLevel}</div>
            {speedLevel > 1 && (
              <div className="text-xs opacity-50">Next boost at {Math.ceil(score / 5) * 5} points</div>
            )}
          </div>
        )}

        {/* New Record Celebration - During gameplay */}
        {showRecordCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="text-center animate-bounce">
              <div className="text-6xl font-mono font-bold text-yellow-400 drop-shadow-lg animate-pulse">
                NEW RECORD!
              </div>
              <div className="text-2xl font-mono text-white mt-2 opacity-90">
                🏆 {score} Points! 🏆
              </div>
            </div>
            {/* Screen flash effect */}
            <div className="absolute inset-0 bg-yellow-400/20 animate-ping"></div>
          </div>
        )}

        {/* New High Score Set Celebration - At game over */}
        {showNewHighScoreSet && gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="text-center animate-pulse">
              <div className="text-5xl font-mono font-bold text-green-400 drop-shadow-lg">
                NEW HIGH SCORE SET!
              </div>
              <div className="text-3xl font-mono text-white mt-4 opacity-90">
                🎉 {score} Points! 🎉
              </div>
              <div className="text-lg font-mono text-white mt-2 opacity-70">
                Congratulations!
              </div>
            </div>
            {/* Confetti effect */}
            <div className="absolute inset-0 bg-green-400/10 animate-pulse"></div>
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && !showHighScores && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-mono mb-8 tracking-wider">PONG</h1>
            <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
              <Button
                onClick={handleStartGame}
                className="w-full bg-white text-black hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
              >
                START GAME
              </Button>
              <Button
                onClick={handleShowHighScores}
                variant="outline"
                className="w-full border-white text-black bg-white hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <div className="bg-white text-black p-8 rounded-lg shadow-2xl border-4 border-black min-w-[400px]">
              <h2 className="text-3xl font-mono mb-8 text-center tracking-wider">HIGH SCORES</h2>
              {scoresLoading ? (
                <div className="text-center font-mono">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {highScores.slice(0, 10).map((score, index) => (
                    <div key={score.id} className="flex justify-between font-mono text-lg border-b border-gray-300 pb-2">
                      <span className="font-bold">{index + 1}. {score.player_name}</span>
                      <span className="font-bold">{score.score}</span>
                    </div>
                  ))}
                  {highScores.length === 0 && (
                    <div className="text-center font-mono text-sm opacity-70">
                      No scores yet. Be the first!
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={() => setShowHighScores(false)}
                className="w-full mt-6 bg-black text-white hover:bg-gray-800 font-mono px-8 py-3 pointer-events-auto"
              >
                BACK
              </Button>
            </div>
          </div>
        )}

        {/* Game over screen */}
        {gameOver && gameStarted && !showAnonymousModal && (
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
                className="border-white text-black bg-white hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
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

      {/* Anonymous name input modal */}
      {showAnonymousModal && pendingScore !== null && (
        <AnonymousNameModal
          score={pendingScore}
          onSubmit={handleAnonymousScoreSubmit}
          onCancel={handleAnonymousScoreCancel}
        />
      )}
    </div>
  );
};

export default PongGame;