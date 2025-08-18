import { useCallback, useEffect, useRef, useState } from 'react';

interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
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
  };
  canvas: {
    width: number;
    height: number;
  };
}

export const usePongGame = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [score, setScore] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const animationFrameRef = useRef<number>();
  const gameStateRef = useRef<GameState>();
  const startTimeRef = useRef<number>();

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
      },
      canvas: {
        width,
        height,
      },
    };
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

    // Move ball
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;

    // Ball collision with top/bottom walls
    if (state.ball.y - state.ball.radius <= 0 || state.ball.y + state.ball.radius >= state.canvas.height) {
      state.ball.dy = -state.ball.dy;
    }

    // Ball collision with player paddle
    if (
      state.ball.x - state.ball.radius <= state.playerPaddle.x + state.playerPaddle.width &&
      state.ball.x - state.ball.radius >= state.playerPaddle.x &&
      state.ball.y >= state.playerPaddle.y &&
      state.ball.y <= state.playerPaddle.y + state.playerPaddle.height
    ) {
      state.ball.dx = -state.ball.dx;
      // Add some randomness to the ball direction
      state.ball.dy += (Math.random() - 0.5) * 2;
      setScore(prev => prev + 1);
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
      state.ball.dy += (Math.random() - 0.5) * 2;
    }

    // AI paddle movement (simple AI that follows the ball)
    const aiPaddleCenter = state.aiPaddle.y + state.aiPaddle.height / 2;
    const ballCenter = state.ball.y;
    const aiSpeed = 3;

    if (aiPaddleCenter < ballCenter - 10) {
      state.aiPaddle.y += aiSpeed;
    } else if (aiPaddleCenter > ballCenter + 10) {
      state.aiPaddle.y -= aiSpeed;
    }

    // Keep AI paddle within bounds
    state.aiPaddle.y = Math.max(0, Math.min(state.canvas.height - state.aiPaddle.height, state.aiPaddle.y));

    // Check for game over (ball goes off left side)
    if (state.ball.x < 0) {
      setGameOver(true);
      setGameRunning(false);
    }

    // Reset ball if it goes off right side (AI misses)
    if (state.ball.x > state.canvas.width) {
      state.ball.x = state.canvas.width / 2;
      state.ball.y = state.canvas.height / 2;
      state.ball.dx = -Math.abs(state.ball.dx);
      state.ball.dy = (Math.random() - 0.5) * 6;
    }
  }, []);

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
    }
  }, [initializeGame]);

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
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    updatePaddlePosition,
  };
};
