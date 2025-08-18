import { useCallback, useEffect, useRef, useState } from 'react';

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
  const audioContextRef = useRef<AudioContext>();
  const soundEffectsRef = useRef<{ [key: string]: AudioBuffer }>({});

  // Initialize audio context and sound effects
  const initializeAudio = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext();
      
      // Create simple sound effects using oscillators
      const createBeep = (frequency: number, duration: number) => {
        const sampleRate = audioContextRef.current!.sampleRate;
        const length = sampleRate * duration;
        const buffer = audioContextRef.current!.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
          const envelope = Math.max(0, 1 - (i / length)); // Fade out envelope
          data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1 * envelope;
        }
        
        return buffer;
      };
      
      soundEffectsRef.current = {
        paddle: createBeep(440, 0.1),
        score: createBeep(660, 0.2),
        speedUp: createBeep(880, 0.3),
        gameOver: createBeep(220, 0.5)
      };
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, []);

  const playSound = useCallback((soundName: string) => {
    if (!audioContextRef.current || !soundEffectsRef.current[soundName]) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = soundEffectsRef.current[soundName];
    source.connect(audioContextRef.current.destination);
    source.start();
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
    }

    // Move ball
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;

    // Ball collision with top/bottom walls
    if (state.ball.y - state.ball.radius <= 0 || state.ball.y + state.ball.radius >= state.canvas.height) {
      state.ball.dy = -state.ball.dy;
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
      playSound('gameOver');
    }

    // Reset ball if it goes off right side (AI misses)
    if (state.ball.x > state.canvas.width) {
      state.ball.x = state.canvas.width / 2;
      state.ball.y = state.canvas.height / 2;
      state.ball.dx = -Math.abs(state.ball.currentSpeed);
      state.ball.dy = (Math.random() - 0.5) * 6;
    }
  }, [score, playSound]);

  const gameLoop = useCallback(() => {
    if (!gameRunning) return;
    
    updateGame();
    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameRunning, updateGame, draw]);

  const startGame = useCallback(() => {
    if (!gameStateRef.current) {
      initializeGame();
    }
    setGameRunning(true);
    setGameOver(false);
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      initializeAudio();
    }
  }, [initializeGame, initializeAudio]);

  const pauseGame = useCallback(() => {
    setGameRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setGameRunning(false);
    setGameOver(false);
    setSpeedLevel(1);
    startTimeRef.current = undefined;
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

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
    draw();
  }, [initializeGame, draw]);

  return {
    gameState: gameStateRef.current,
    score,
    speedLevel,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    updatePaddlePosition,
    playSound,
  };
};
