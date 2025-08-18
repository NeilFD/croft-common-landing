import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trophy, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePongGame } from '@/hooks/usePongGame';
import { usePongHighScores } from '@/hooks/usePongHighScores';
import CroftLogo from './CroftLogo';

interface PongGameProps {
  onClose: () => void;
}

const PongGame = ({ onClose }: PongGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHighScores, setShowHighScores] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>();
  
  const {
    gameState,
    score,
    speedLevel,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    updatePaddlePosition,
    playSound
  } = usePongGame(canvasRef);

  const { 
    highScores, 
    submitScore, 
    loading: scoresLoading 
  } = usePongHighScores();

  // Initialize background music with retro melody
  useEffect(() => {
    if (audioEnabled && gameStarted && gameRunning) {
      try {
        const audioContext = new AudioContext();
        const masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
        masterGain.gain.setValueAtTime(0.03, audioContext.currentTime);

        // Create a retro melody sequence
        const melody = [
          { freq: 330, duration: 0.5 }, // E4
          { freq: 370, duration: 0.5 }, // F#4
          { freq: 415, duration: 0.5 }, // G#4
          { freq: 330, duration: 0.5 }, // E4
          { freq: 277, duration: 0.5 }, // C#4
          { freq: 311, duration: 0.5 }, // D#4
          { freq: 277, duration: 1.0 }, // C#4 (longer)
          { freq: 247, duration: 1.0 }, // B3 (longer)
        ];

        let currentTime = audioContext.currentTime;
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);

        const playMelody = () => {
          melody.forEach((note) => {
            // Main oscillator
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();
            
            osc.connect(noteGain);
            noteGain.connect(masterGain);
            
            osc.frequency.setValueAtTime(note.freq, currentTime);
            osc.type = 'square';
            
            // Envelope for each note
            noteGain.gain.setValueAtTime(0, currentTime);
            noteGain.gain.linearRampToValueAtTime(0.8, currentTime + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.1, currentTime + note.duration - 0.05);
            noteGain.gain.linearRampToValueAtTime(0, currentTime + note.duration);
            
            osc.start(currentTime);
            osc.stop(currentTime + note.duration);
            
            currentTime += note.duration;
          });
        };

        // Play melody and set up loop
        playMelody();
        const loopInterval = setInterval(() => {
          currentTime = audioContext.currentTime;
          playMelody();
        }, totalDuration * 1000);

        return () => {
          clearInterval(loopInterval);
          try {
            audioContext.close();
          } catch (e) {
            // Ignore cleanup errors
          }
        };
      } catch (e) {
        console.warn('Background music initialization failed:', e);
      }
    }
  }, [audioEnabled, gameStarted, gameRunning]);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
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
      submitScore(score);
    }
    
    // Reset flag when game starts
    if (gameRunning && !gameOver) {
      scoreSubmittedRef.current = false;
    }
  }, [gameOver, score, submitScore, gameRunning]);

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
          <div className="absolute top-20 left-4 text-white font-mono space-y-1">
            <div className="text-2xl">Score: {score}</div>
            <div className="text-sm opacity-70">Speed Level: {speedLevel}</div>
            {speedLevel > 1 && (
              <div className="text-xs opacity-50">Next boost at {Math.ceil(score / 5) * 5} points</div>
            )}
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
                className="border-white text-black bg-white hover:bg-white/90 font-mono px-8 py-3 pointer-events-auto"
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
    </div>
  );
};

export default PongGame;