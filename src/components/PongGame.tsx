import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trophy, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePongGame } from '@/hooks/usePongGame';
import { usePongHighScores } from '@/hooks/usePongHighScores';
import { useAuth } from '@/hooks/useAuth';
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
  const [hasShownRecordCelebration, setHasShownRecordCelebration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileAudioEnabled, setMobileAudioEnabled] = useState(false);
  const [audioInitializing, setAudioInitializing] = useState(false);
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
    playGameOverMusic,
    startGameSilent,
    initializeAudio,
    audioManagerRef
  } = usePongGame(canvasRef);

  const { 
    highScores, 
    submitScore,
    requestAnonymousScore,
    loading: scoresLoading,
    isAuthenticated
  } = usePongHighScores();
  
  const { loading: authLoading } = useAuth();

  // Get current high score for display and comparison
  const currentHighScore = highScores.length > 0 ? highScores[0].score : 0;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Audio is now handled by the comprehensive chiptune system in PongAudioManager

  const toggleAudio = async () => {
    const newMutedState = toggleMute();
    setAudioEnabled(!newMutedState);
  };

  const handleMobileAudioEnable = async () => {
    if (audioInitializing) return;
    
    setAudioInitializing(true);
    console.log('🎵 Mobile audio enable clicked - iPhone detected');
    
    try {
      // iOS Safari requires synchronous AudioContext creation within user gesture
      // Create AudioContext immediately within the button click event
      const audioInitialized = await new Promise<boolean>((resolve) => {
        // Force immediate AudioContext creation for iOS
        const tempAudio = new Audio();
        tempAudio.volume = 0;
        tempAudio.play().catch(() => {});
        
        // Initialize audio synchronously within the user gesture
        initializeAudio().then((result) => {
          console.log('🎵 Synchronous audio init result:', result);
          resolve(result);
        }).catch((error) => {
          console.error('🎵 Synchronous audio init failed:', error);
          resolve(false);
        });
      });
      
      if (audioInitialized && audioManagerRef.current) {
        console.log('🎵 Audio context created, resuming and starting music...');
        
        // Immediately resume AudioContext within the user gesture
        if (audioManagerRef.current.audioContext?.state !== 'running') {
          await audioManagerRef.current.audioContext?.resume();
          console.log('🎵 AudioContext resumed, state:', audioManagerRef.current.audioContext?.state);
        }
        
        // Set states immediately
        setMobileAudioEnabled(true);
        setAudioEnabled(true);
        
        // Start music immediately within the same user gesture
        if (audioManagerRef.current.audioContext?.state === 'running') {
          try {
            if (gameRunning && !gameOver) {
              await audioManagerRef.current.playMusic('main', true);
            } else if (gameOver) {
              await audioManagerRef.current.playMusic('gameover', false);
            } else {
              await audioManagerRef.current.playMusic('intro', false);
            }
            console.log('🎵 Music started successfully on iPhone');
          } catch (musicError) {
            console.error('🎵 Music start failed:', musicError);
          }
        }
      } else {
        console.warn('🎵 Audio initialization failed');
      }
    } catch (error) {
      console.error('🎵 Mobile audio enable failed:', error);
    } finally {
      setAudioInitializing(false);
    }
  };

  // Handle mouse movement for paddle control
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    updatePaddlePosition(y);
  }, [updatePaddlePosition]);

  // Handle touch movement for mobile paddle control
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Only prevent default if we're in game and touching the canvas area
    if (gameRunning && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      updatePaddlePosition(y);
    }
  }, [updatePaddlePosition, gameRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add passive: false to allow preventDefault when needed
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  // Helper function to check if score qualifies as high score
  const isQualifyingHighScore = useCallback((score: number) => {
    if (highScores.length < 10) return true; // Less than 10 scores, any score qualifies
    const lowestHighScore = highScores[highScores.length - 1]?.score || 0;
    return score > lowestHighScore;
  }, [highScores]);

  // Handle game over - submit score only once
  const scoreSubmittedRef = useRef(false);
  
  useEffect(() => {
    if (gameOver && score > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      playGameOverMusic();
      
      // Wait for auth state to fully load, then check submission logic
      const checkAuthAndSubmit = () => {
        console.log('🏆 Auth state - loading:', authLoading, 'isAuthenticated:', isAuthenticated);
        console.log('🏆 Score submission check - score:', score, 'qualifying:', isQualifyingHighScore(score));
        
        if (authLoading) {
          // Auth still loading, wait longer
          console.log('🏆 Auth still loading, waiting...');
          setTimeout(checkAuthAndSubmit, 200);
          return;
        }
        
        if (isAuthenticated) {
          console.log('🏆 Submitting score for authenticated user');
          submitScore(score);
        } else if (isQualifyingHighScore(score)) {
          // Only show modal for unauthenticated users with qualifying high scores
          console.log('🏆 Showing anonymous modal - user not authenticated and score qualifies');
          setPendingScore(score);
          setShowAnonymousModal(true);
        } else {
          console.log('🏆 Score does not qualify for high score list or user is authenticated');
        }
      };
      
      setTimeout(checkAuthAndSubmit, 300);
    }
    
    // Reset flags when game starts
    if (gameRunning && !gameOver) {
      scoreSubmittedRef.current = false;
      setShowRecordCelebration(false);
      setShowNewHighScoreSet(false);
      setHasShownRecordCelebration(false);
      
      // Set the initial high score threshold for this game session
      if (initialHighScore === null && currentHighScore > 0) {
        setInitialHighScore(currentHighScore);
      }
    }
  }, [gameOver, score, submitScore, gameRunning, isAuthenticated, authLoading, isQualifyingHighScore, playGameOverMusic]);

  // Check for high score beating during gameplay - only once per game session
  useEffect(() => {
    if (gameStarted && gameRunning && !gameOver && score > 0 && initialHighScore !== null) {
      if (score > initialHighScore && !hasShownRecordCelebration) {
        setHasShownRecordCelebration(true);
        setShowRecordCelebration(true);
        playSound('record_broken');
        
        // Hide celebration after 3 seconds
        setTimeout(() => {
          setShowRecordCelebration(false);
        }, 3000);
      }
    }
  }, [score, initialHighScore, hasShownRecordCelebration, gameStarted, gameRunning, gameOver, playSound]);

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

  const handleStartGame = async () => {
    setGameStarted(true);
    setShowHighScores(false);
    
    // For desktop: initialize audio automatically
    // For mobile: only if user has enabled audio
    try {
      if (!isMobile || mobileAudioEnabled) {
        await startGame();
      } else {
        // Start game without audio on mobile
        startGameSilent();
      }
    } catch (error) {
      console.warn('Game start failed:', error);
      startGameSilent();
    }
  };

  const handleShowHighScores = () => {
    setShowHighScores(true);
  };

  const handlePlayAgain = async () => {
    resetGame();
    setGameStarted(true);
    setShowHighScores(false);
    setInitialHighScore(null); // Reset for new game session
    setShowNewHighScoreSet(false);
    setHasShownRecordCelebration(false); // Reset celebration flag
    
    try {
      if (!isMobile || mobileAudioEnabled) {
        await startGame();
      } else {
        startGameSilent();
      }
    } catch (error) {
      console.warn('Game restart failed:', error);
      startGameSilent();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Header with branding */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-10 px-4">
        <CroftLogo size="sm" className="mb-2 invert" />
        <h1 className="text-lg sm:text-xl font-mono tracking-wider text-center">CROFT COMMON</h1>
        <p className="text-xs opacity-70 font-mono text-center">RETRO ARCADE</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border border-white"
        style={{ 
          maxWidth: '95vw', 
          maxHeight: '60vh',
          aspectRatio: '2/1'
        }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mobile Audio Enable Button */}
        {isMobile && !mobileAudioEnabled && gameStarted && (
          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20">
            <Button
              onClick={handleMobileAudioEnable}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMobileAudioEnable();
              }}
              variant="outline"
              size="sm"
              disabled={audioInitializing}
              className="bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300 font-mono text-xs px-4 py-2 touch-manipulation select-none shadow-lg min-h-[44px]"
              style={{
                animation: audioInitializing ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              {audioInitializing ? '🔄 Loading...' : '🔊 Turn Audio On'}
            </Button>
          </div>
        )}

        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-20">
          <Button
            onClick={toggleAudio}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleAudio();
            }}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 touch-manipulation select-none"
            aria-label="Toggle audio"
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              onClose();
            }}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 touch-manipulation select-none"
            aria-label="Close game"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Score and level display */}
        {gameStarted && (
          <div className="absolute top-16 sm:top-20 left-2 sm:left-4 text-white font-mono space-y-1 sm:space-y-2">
            <div className="text-xl sm:text-2xl">Score: {score}</div>
            <div className="text-sm sm:text-lg opacity-90 border border-white/30 px-1 sm:px-2 py-1 rounded bg-black/30">
              High Score: {currentHighScore}
            </div>
            <div className="text-xs sm:text-sm opacity-70">Speed Level: {speedLevel}</div>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
            <h1 className="text-3xl sm:text-4xl font-mono mb-6 sm:mb-8 tracking-wider">PONG</h1>
            <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
              <Button
                onClick={handleStartGame}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleStartGame();
                }}
                className="w-full bg-white text-black hover:bg-white/90 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
              >
                START GAME
              </Button>
              <Button
                onClick={handleShowHighScores}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleShowHighScores();
                }}
                variant="outline"
                className="w-full border-white text-black bg-white hover:bg-white/90 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
              >
                <Trophy className="h-4 w-4 mr-2" />
                HIGH SCORES
              </Button>
            </div>
            <p className="text-xs sm:text-sm mt-6 sm:mt-8 opacity-70 font-mono text-center">
              <span className="hidden sm:inline">Move your mouse to control the left paddle</span>
              <span className="sm:hidden">Touch and drag to control the left paddle</span>
            </p>
          </div>
        )}

        {/* High scores screen */}
        {showHighScores && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 px-4">
            <div className="bg-white text-black p-4 sm:p-8 rounded-lg shadow-2xl border-4 border-black w-full max-w-md sm:min-w-[400px]">
              <h2 className="text-2xl sm:text-3xl font-mono mb-6 sm:mb-8 text-center tracking-wider">HIGH SCORES</h2>
              {scoresLoading ? (
                <div className="text-center font-mono">Loading...</div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {highScores.slice(0, 10).map((score, index) => (
                    <div key={score.id} className="flex justify-between font-mono text-sm sm:text-lg border-b border-gray-300 pb-1 sm:pb-2">
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
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setShowHighScores(false);
                }}
                className="w-full mt-4 sm:mt-6 bg-black text-white hover:bg-gray-800 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
              >
                BACK
              </Button>
            </div>
          </div>
        )}

        {/* Game over screen */}
        {gameOver && gameStarted && !showAnonymousModal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 px-4">
            <h2 className="text-2xl sm:text-3xl font-mono mb-4 tracking-wider text-center">GAME OVER</h2>
            <p className="text-lg sm:text-xl font-mono mb-6 sm:mb-8 text-center">Final Score: {score}</p>
            <div className="space-y-4 w-full max-w-xs">
              <Button
                onClick={handlePlayAgain}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handlePlayAgain();
                }}
                className="w-full bg-white text-black hover:bg-white/90 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                PLAY AGAIN
              </Button>
              <Button
                onClick={handleShowHighScores}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleShowHighScores();
                }}
                variant="outline"
                className="w-full border-white text-black bg-white hover:bg-white/90 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
              >
                <Trophy className="h-4 w-4 mr-2" />
                HIGH SCORES
              </Button>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {!gameRunning && gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50 px-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-mono mb-4">PAUSED</p>
              <Button
                onClick={startGame}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  startGame();
                }}
                className="bg-white text-black hover:bg-white/90 font-mono px-6 sm:px-8 py-3 pointer-events-auto touch-manipulation text-sm sm:text-base select-none"
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