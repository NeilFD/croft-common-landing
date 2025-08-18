import { useState, useRef, useCallback, useEffect } from 'react';
import type { PongAudioManager } from '../lib/PongAudioManager';

interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    baseSpeed: number;
    currentSpeed: number;
  };
  playerPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  aiPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    baseSpeed: number;
    currentSpeed: number;
  };
  canvas: {
    width: number;
    height: number;
  };
  speedLevel: number;
  lastSpeedIncrease: number;
}

export const usePongGame = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [score, setScore] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(1);
  const animationFrameRef = useRef<number>();
  const gameStateRef = useRef<GameState>();
  const startTimeRef = useRef<number>();
  const audioManagerRef = useRef<PongAudioManager>();

  // Initialize audio manager (but not AudioContext yet)
  const prepareAudio = useCallback(async () => {
    try {
      const { PongAudioManager } = await import('../lib/PongAudioManager');
      audioManagerRef.current = new PongAudioManager();
    } catch (error) {
      console.warn('Audio preparation failed:', error);
    }
  }, []);

  // Initialize AudioContext within user gesture and then generate audio
  const initializeAudio = useCallback(async () => {
    try {
      if (!audioManagerRef.current) {
        await prepareAudio();
      }
      
      if (!audioManagerRef.current) {
        console.error('Failed to create audio manager');
        return false;
      }

      // Create AudioContext synchronously within user gesture
      const success = audioManagerRef.current.initializeAudioContext();
      if (!success) {
        console.error('Failed to create AudioContext');
        return false;
      }

      // For mobile: Additional checks and longer stabilization time
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const stabilizationTime = isMobile ? 300 : 100;
      
      // Wait for AudioContext to stabilize
      await new Promise(resolve => setTimeout(resolve, stabilizationTime));

      // Check if AudioContext is actually running
      if (audioManagerRef.current.audioContext?.state === 'suspended') {
        await audioManagerRef.current.audioContext.resume();
        // Give it more time on mobile
        await new Promise(resolve => setTimeout(resolve, isMobile ? 200 : 50));
      }

      // Generate audio content asynchronously with retry logic
      const maxAttempts = isMobile ? 5 : 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await audioManagerRef.current.initializeAudio();
          console.log(`Audio initialization successful on attempt ${attempt + 1}`);
          return true;
        } catch (error) {
          console.warn(`Audio initialization attempt ${attempt + 1} failed:`, error);
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, isMobile ? 500 : 200));
          }
        }
      }
      
      console.error(`Audio initialization failed after ${maxAttempts} attempts`);
      return false;
    } catch (error) {
      console.error('Audio initialization error:', error);
      return false;
    }
  }, [prepareAudio]);

  const playSound = useCallback((soundName: string) => {
    audioManagerRef.current?.playSoundEffect(soundName);
  }, []);

  const initializeGame = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    gameStateRef.current = {
      ball: {
        x: width / 2,
        y: height / 2,
        dx: 4,
        dy: 3,
        radius: 8,
        baseSpeed: 4,
        currentSpeed: 4,
      },
      playerPaddle: {
        x: 10,
        y: height / 2 - 50,
        width: 10,
        height: 100,
      },
      aiPaddle: {
        x: width - 20,
        y: height / 2 - 50,
        width: 10,
        height: 100,
        baseSpeed: 3,
        currentSpeed: 3,
      },
      canvas: {
        width,
        height,
      },
      speedLevel: 1,
      lastSpeedIncrease: 0,
    };
    
    setSpeedLevel(1);
  }, [canvasRef]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !gameStateRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;
    
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    // Draw center line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(state.canvas.width / 2, 0);
    ctx.lineTo(state.canvas.width / 2, state.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(state.playerPaddle.x, state.playerPaddle.y, state.playerPaddle.width, state.playerPaddle.height);
    ctx.fillRect(state.aiPaddle.x, state.aiPaddle.y, state.aiPaddle.width, state.aiPaddle.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }, [canvasRef]);

  const updateGame = useCallback(() => {
    if (!gameStateRef.current) return;
    
    const state = gameStateRef.current;

    // Check for speed increase every 5 points
    const currentScoreLevel = Math.floor(score / 5);
    if (currentScoreLevel > state.speedLevel - 1 && score > state.lastSpeedIncrease) {
      state.speedLevel++;
      state.lastSpeedIncrease = score;
      const speedMultiplier = 1 + (state.speedLevel - 1) * 0.2; // 20% increase per level
      const maxSpeedMultiplier = 2.5; // Cap at 250% of base speed
      
      const finalSpeedMultiplier = Math.min(speedMultiplier, maxSpeedMultiplier);
      
      // Increase ball speed
      state.ball.currentSpeed = state.ball.baseSpeed * finalSpeedMultiplier;
      const currentDirection = {
        x: state.ball.dx > 0 ? 1 : -1,
        y: state.ball.dy > 0 ? 1 : -1
      };
      state.ball.dx = state.ball.currentSpeed * currentDirection.x;
      state.ball.dy = state.ball.dy * finalSpeedMultiplier;
      
      // Increase AI speed but keep it slightly slower than ball
      state.aiPaddle.currentSpeed = state.aiPaddle.baseSpeed * (finalSpeedMultiplier * 0.8);
      
      setSpeedLevel(state.speedLevel);
      playSound('speedUp');
      
      // Switch to B-section music variation occasionally
      if (state.speedLevel % 3 === 0) {
        audioManagerRef.current?.switchMainLoop();
      }
    }

    // Move ball
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;

    // Ball collision with top/bottom walls with minimum angle enforcement
    if (state.ball.y - state.ball.radius <= 0 || state.ball.y + state.ball.radius >= state.canvas.height) {
      state.ball.dy = -state.ball.dy;
      
      // Enforce minimum angle to prevent horizontal tracking
      const minVerticalSpeed = 1.5;
      if (Math.abs(state.ball.dy) < minVerticalSpeed) {
        state.ball.dy = state.ball.dy > 0 ? minVerticalSpeed : -minVerticalSpeed;
      }
      
      // Add slight randomization to prevent perfect tracking
      state.ball.dy += (Math.random() - 0.5) * 0.5;
      
      playSound('paddle');
    }

    // Ball collision with player paddle
    if (
      state.ball.x - state.ball.radius <= state.playerPaddle.x + state.playerPaddle.width &&
      state.ball.x - state.ball.radius >= state.playerPaddle.x &&
      state.ball.y >= state.playerPaddle.y &&
      state.ball.y <= state.playerPaddle.y + state.playerPaddle.height
    ) {
      state.ball.dx = -state.ball.dx;
      // Add some randomness to the ball direction based on paddle position
      const paddleCenter = state.playerPaddle.y + state.playerPaddle.height / 2;
      const hitPosition = (state.ball.y - paddleCenter) / (state.playerPaddle.height / 2);
      state.ball.dy = hitPosition * 4 + (Math.random() - 0.5) * 2;
      
      // Enforce minimum and maximum angles to prevent extreme trajectories
      const maxVerticalSpeed = 6;
      const minVerticalSpeed = 1;
      if (Math.abs(state.ball.dy) > maxVerticalSpeed) {
        state.ball.dy = state.ball.dy > 0 ? maxVerticalSpeed : -maxVerticalSpeed;
      } else if (Math.abs(state.ball.dy) < minVerticalSpeed) {
        state.ball.dy = state.ball.dy > 0 ? minVerticalSpeed : -minVerticalSpeed;
      }
      
      setScore(prev => {
        const newScore = prev + 1;
        return newScore;
      });
      playSound('score');
    }

    // Ball collision with AI paddle
    if (
      state.ball.x + state.ball.radius >= state.aiPaddle.x &&
      state.ball.x + state.ball.radius <= state.aiPaddle.x + state.aiPaddle.width &&
      state.ball.y >= state.aiPaddle.y &&
      state.ball.y <= state.aiPaddle.y + state.aiPaddle.height
    ) {
      state.ball.dx = -state.ball.dx;
      // Add some randomness to the ball direction
      const paddleCenter = state.aiPaddle.y + state.aiPaddle.height / 2;
      const hitPosition = (state.ball.y - paddleCenter) / (state.aiPaddle.height / 2);
      state.ball.dy = hitPosition * 4 + (Math.random() - 0.5) * 2;
      
      // Enforce minimum and maximum angles to prevent extreme trajectories
      const maxVerticalSpeed = 6;
      const minVerticalSpeed = 1;
      if (Math.abs(state.ball.dy) > maxVerticalSpeed) {
        state.ball.dy = state.ball.dy > 0 ? maxVerticalSpeed : -maxVerticalSpeed;
      } else if (Math.abs(state.ball.dy) < minVerticalSpeed) {
        state.ball.dy = state.ball.dy > 0 ? minVerticalSpeed : -minVerticalSpeed;
      }
      
      playSound('paddle');
    }

    // Enhanced AI paddle movement with difficulty scaling
    const aiPaddleCenter = state.aiPaddle.y + state.aiPaddle.height / 2;
    const ballCenter = state.ball.y;
    const aiSpeed = state.aiPaddle.currentSpeed;
    
    // Add some imperfection to AI - it's not perfect at higher speeds
    const aiErrorMargin = Math.max(5, 20 - state.speedLevel * 2);
    
    if (aiPaddleCenter < ballCenter - aiErrorMargin) {
      state.aiPaddle.y += aiSpeed;
    } else if (aiPaddleCenter > ballCenter + aiErrorMargin) {
      state.aiPaddle.y -= aiSpeed;
    }

    // Keep AI paddle within bounds
    state.aiPaddle.y = Math.max(0, Math.min(state.canvas.height - state.aiPaddle.height, state.aiPaddle.y));

    // Check for game over (ball goes off left side)
    if (state.ball.x < 0) {
      setGameOver(true);
      setGameRunning(false);
      audioManagerRef.current?.playMusic('gameover', false);
      playSound('gameover');
    }

    // Reset ball if it goes off right side (AI misses)
    if (state.ball.x > state.canvas.width) {
      state.ball.x = state.canvas.width / 2;
      state.ball.y = state.canvas.height / 2;
      state.ball.dx = -Math.abs(state.ball.currentSpeed);
      
      // Ensure proper angle with minimum vertical speed
      const randomAngle = (Math.random() - 0.5) * 6;
      const minVerticalSpeed = 2;
      state.ball.dy = Math.abs(randomAngle) < minVerticalSpeed 
        ? (randomAngle > 0 ? minVerticalSpeed : -minVerticalSpeed)
        : randomAngle;
    }
  }, [score, playSound]);

  const gameLoop = useCallback(() => {
    if (!gameRunning) return;
    
    updateGame();
    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameRunning, updateGame, draw]);

  const startGame = useCallback(async () => {
    if (!canvasRef.current) return;
    
    console.log('Starting game and initializing audio...');
    
    // Initialize audio SYNCHRONOUSLY within user gesture with error handling
    const audioInitialized = await initializeAudio();
    
    initializeGame();
    setGameRunning(true);
    setGameOver(false);
    setScore(0);
    startTimeRef.current = Date.now();
    
    // Only play music if audio was successfully initialized
    if (audioInitialized && audioManagerRef.current) {
      // Detect mobile for different timing
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const initialDelay = isMobile ? 500 : 200;
      
      // Give more time on mobile for audio context to fully initialize
      setTimeout(() => {
        if (audioManagerRef.current?.audioContext?.state === 'running') {
          audioManagerRef.current?.playMusic('intro', false);
          setTimeout(() => {
            if (audioManagerRef.current?.audioContext?.state === 'running') {
              audioManagerRef.current?.playMusic('main', true);
            }
          }, 3000); // 3 second intro
        } else {
          console.warn('AudioContext not in running state, skipping music');
        }
      }, initialDelay);
    } else {
      console.warn('Audio not available, continuing without sound');
    }
    
    gameLoop();
  }, [canvasRef, initializeGame, gameLoop, initializeAudio]);

  const pauseGame = useCallback(() => {
    setGameRunning(false);
    audioManagerRef.current?.stopMusic();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameRunning(false);
    setGameOver(false);
    setScore(0);
    setSpeedLevel(1);
    audioManagerRef.current?.stopMusic();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    initializeGame();
  }, [initializeGame]);

  const updatePaddlePosition = useCallback((mouseY: number) => {
    if (!gameStateRef.current) return;
    
    const state = gameStateRef.current;
    const paddleHeight = state.playerPaddle.height;
    const canvasHeight = state.canvas.height;
    
    // Center paddle on mouse position
    let newY = mouseY - paddleHeight / 2;
    
    // Keep paddle within bounds
    newY = Math.max(0, Math.min(canvasHeight - paddleHeight, newY));
    
    state.playerPaddle.y = newY;
  }, []);

  // Additional audio controls
  const setMusicVolume = useCallback((volume: number) => {
    audioManagerRef.current?.setMusicVolume(volume);
  }, []);

  const setSFXVolume = useCallback((volume: number) => {
    audioManagerRef.current?.setSFXVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    return audioManagerRef.current?.toggleMute() || false;
  }, []);

  const switchMusicLoop = useCallback(() => {
    audioManagerRef.current?.switchMainLoop();
  }, []);

  const startGameSilent = useCallback(() => {
    if (!canvasRef.current) return;
    
    console.log('Starting game silently (no audio)...');
    
    initializeGame();
    setGameRunning(true);
    setGameOver(false);
    setScore(0);
    startTimeRef.current = Date.now();
    
    gameLoop();
  }, [canvasRef, initializeGame, gameLoop]);

  const playVictoryMusic = useCallback(() => {
    audioManagerRef.current?.playMusic('victory', false);
  }, []);

  const playGameOverMusic = useCallback(() => {
    audioManagerRef.current?.playMusic('gameover', false);
  }, []);

  // Start game loop when game is running
  useEffect(() => {
    if (gameRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameRunning, gameLoop]);

  // Initialize game and prepare audio on mount
  useEffect(() => {
    initializeGame();
    draw();
    prepareAudio(); // Prepare audio manager (but not AudioContext)
  }, [initializeGame, draw, prepareAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioManagerRef.current?.cleanup();
    };
  }, []);

  return {
    score,
    speedLevel,
    gameRunning,
    gameOver,
    startGame,
    startGameSilent,
    pauseGame,
    resetGame,
    updatePaddlePosition,
    playSound,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    switchMusicLoop,
    playVictoryMusic,
    playGameOverMusic,
    initializeAudio,
    audioManagerRef,
  };
};
