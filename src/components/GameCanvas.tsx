import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Particle, Pipe, Cloud } from '../types';
import { COLORS, PHYSICS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  setScore: (score: (prev: number) => number) => void;
  onGameOver: (finalScore: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  score,
  setScore,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game state held in refs for the animation loop
  const catRef = useRef({
    y: 300,
    vy: 0,
    rotation: 0,
    wingFlap: 0,
    targetRotation: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const frameCountRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const initGame = useCallback(() => {
    catRef.current = {
      y: dimensionsRef.current.height / 2,
      vy: 0,
      rotation: 0,
      wingFlap: 0,
      targetRotation: 0,
    };
    pipesRef.current = [];
    particlesRef.current = [];
    setScore(() => 0);
    frameCountRef.current = 0;
  }, [setScore]);

  useEffect(() => {
    if (gameState === GameState.START) {
      initGame();
    }
  }, [gameState, initGame]);

  const handleJump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      catRef.current.vy = PHYSICS.LIFT;
      catRef.current.targetRotation = -20;
    } else if (gameState === GameState.START) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState, setGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleJump();
      }
    };
    const handleTouch = (e: Event) => {
      e.preventDefault();
      handleJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handleTouch, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handleTouch);
    };
  }, [handleJump]);

  const spawnPipe = (width: number, height: number) => {
    const pipeGap = height * 0.25; // 25% of height for gap
    const minHeight = height * 0.1;
    const maxHeight = height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    pipesRef.current.push({ x: width, topHeight, passed: false });
  };

  const update = (width: number, height: number) => {
    frameCountRef.current++;
    
    const catX = width * 0.2; // Cat stays at 20% horizontal
    const pipeGap = height * 0.25;
    const pipeWidth = Math.max(60, width * 0.15);

    if (gameState !== GameState.PLAYING) {
      // Gentle floating in start screen
      if (gameState === GameState.START) {
        catRef.current.y = height / 2 + Math.sin(frameCountRef.current * 0.05) * 20;
        catRef.current.wingFlap = Math.sin(frameCountRef.current * 0.1);
      }
      return;
    }

    // Physics (Adjusted for frame rate/screen size if needed, but gravity is usually fine)
    catRef.current.vy += PHYSICS.GRAVITY;
    catRef.current.y += catRef.current.vy;
    
    // Rotation logic
    catRef.current.targetRotation = Math.min(Math.max(catRef.current.vy * 4, -30), 90);
    catRef.current.rotation += (catRef.current.targetRotation - catRef.current.rotation) * 0.1;
    
    // Wing flap
    catRef.current.wingFlap = Math.sin(frameCountRef.current * 0.2);

    // Particles
    if (frameCountRef.current % 3 === 0) {
      particlesRef.current.push({
        x: catX - 10,
        y: catRef.current.y,
        vx: -1 - Math.random(),
        vy: (Math.random() - 0.5),
        life: 1,
        maxLife: 30 + Math.random() * 20,
        color: `hsl(${200 + Math.random() * 60}, 100%, 80%)`,
        size: 2 + Math.random() * 3,
        type: 'sparkle'
      });
    }

    // Petals
    if (Math.random() < 0.02) {
      particlesRef.current.push({
        x: width + 50,
        y: Math.random() * height,
        vx: -(1 + Math.random()),
        vy: 0.5 + Math.random() * 0.5,
        life: 1,
        maxLife: 200,
        color: COLORS.flower1,
        size: 4 + Math.random() * 4,
        type: 'petal'
      });
    }

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Pipes (Spawn interval based on width/speed ratio)
    const spawnInterval = Math.max(60, Math.floor(width / (PHYSICS.PIPE_SPEED * 1.5)));
    if (frameCountRef.current % spawnInterval === 0) {
      spawnPipe(width, height);
    }

    pipesRef.current.forEach(pipe => {
      pipe.x -= PHYSICS.PIPE_SPEED;
    });

    // Scoring
    pipesRef.current.forEach(pipe => {
      if (!pipe.passed && pipe.x + pipeWidth < catX) {
        pipe.passed = true;
        setScore(s => s + 1);
      }
    });

    pipesRef.current = pipesRef.current.filter(p => p.x + pipeWidth > -50);

    // Clouds
    cloudsRef.current.forEach(c => {
      c.x -= c.speed;
      if (c.x < -200) c.x = width + 200;
    });

    // Collisions
    const catSize = PHYSICS.CAT_SIZE * (width < 600 ? 0.6 : 0.7); // Scale hitbox for smaller screens
    if (catRef.current.y < 0 || catRef.current.y > height) {
      onGameOver(score);
    }

    pipesRef.current.forEach(pipe => {
      const horizontalHit = catX + catSize > pipe.x && catX - catSize < pipe.x + pipeWidth;
      const verticalHit = catRef.current.y - catSize < pipe.topHeight || catRef.current.y + catSize > pipe.topHeight + pipeGap;
      if (horizontalHit && verticalHit) {
        onGameOver(score);
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const pipeWidth = Math.max(60, width * 0.15);
    const pipeGap = height * 0.25;
    const catX = width * 0.2;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, COLORS.skyStart);
    grad.addColorStop(1, COLORS.skyEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    
    // Distant Hills (Parallax)
    ctx.fillStyle = COLORS.pipeBody;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i <= width; i += 50) {
      ctx.lineTo(i, height - 120 + Math.sin(i * 0.01 + frameCountRef.current * 0.005) * 40);
    }
    ctx.lineTo(width, height);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    cloudsRef.current.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 30 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 40 * c.scale, c.y, 40 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 80 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'sparkle') {
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s/4, p.y - s/4);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s/4, p.y + s/4);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s/4, p.y + s/4);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s/4, p.y - s/4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size / 2, Math.PI / 4 + p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Pipes
    pipesRef.current.forEach(pipe => {
      // Top Pipe
      drawPipe(ctx, pipe.x, 0, pipeWidth, pipe.topHeight, true);
      // Bottom Pipe
      drawPipe(ctx, pipe.x, pipe.topHeight + pipeGap, pipeWidth, height - (pipe.topHeight + pipeGap), false);
    });

    // Cat
    const isSad = gameState === GameState.GAME_OVER;
    drawCat(ctx, catX, catRef.current.y, catRef.current.rotation, catRef.current.wingFlap, isSad);
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isTop: boolean) => {
    ctx.fillStyle = COLORS.pipeBody;
    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 3;
    
    // Main Body
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, isTop ? [0, 0, 20, 20] : [20, 20, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // The "Lip"
    const lipHeight = 30;
    const lipY = isTop ? y + h - lipHeight : y;
    ctx.beginPath();
    ctx.roundRect(x - 5, lipY, w + 10, lipHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Vines
    ctx.strokeStyle = COLORS.vine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < h; i += 10) {
      const offsetX = Math.sin(i * 0.1 + x * 0.01) * 10;
      if (i === 0) ctx.moveTo(x + w / 2 + offsetX, y + i);
      else ctx.lineTo(x + w / 2 + offsetX, y + i);
    }
    ctx.stroke();

    // Small flowers
    for (let i = 20; i < h - 20; i += 40) {
      const flowerX = x + w / 2 + Math.sin(i * 0.1 + x * 0.01) * 10;
      ctx.fillStyle = i % 80 === 0 ? COLORS.flower1 : COLORS.flower2;
      ctx.beginPath();
      ctx.arc(flowerX - 5, y + i, 4, 0, Math.PI * 2);
      ctx.arc(flowerX + 5, y + i, 4, 0, Math.PI * 2);
      ctx.arc(flowerX, y + i - 5, 4, 0, Math.PI * 2);
      ctx.arc(flowerX, y + i + 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(flowerX, y + i, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawCat = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, wingFlap: number, isSad: boolean = false) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);

    // Squish effect based on vertical velocity
    const velocityScale = Math.abs(catRef.current.vy) * 0.02;
    const scaleY = 1 - velocityScale;
    const scaleX = 1 + velocityScale;
    ctx.scale(scaleX, scaleY);

    const size = PHYSICS.CAT_SIZE;

    // --- BUTTERFLY WINGS (Back) ---
    const drawWingPair = (side: 'back' | 'front', flap: number) => {
      ctx.save();
      ctx.translate(side === 'back' ? -10 : -15, side === 'back' ? -5 : 5);
      ctx.rotate(flap);
      
      const wingColors = side === 'back' ? ['#fbc2eb', '#a6c1ee'] : ['#ff9a9e', '#fbc2eb'];
      
      const drawSingleWing = (angle: number, s: number, col: string) => {
        ctx.save();
        ctx.rotate(angle);
        
        // Wing shape
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * s);
        grad.addColorStop(0, col);
        grad.addColorStop(1, '#fff');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-size * s, -size * s * 1.5, -size * s * 2, size * s * 0.5, 0, 0);
        ctx.fill();
        ctx.stroke();
        
        // Wing patterns (black spots)
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(-size * s * 0.8, -size * s * 0.4, size * s * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      };

      drawSingleWing(-0.5, 1.2, wingColors[0]);
      drawSingleWing(0.5, 0.8, wingColors[1]);
      
      ctx.restore();
    };

    drawWingPair('back', wingFlap * 0.5);

    // --- TAIL ---
    ctx.save();
    ctx.translate(-size * 0.8, size * 0.2);
    ctx.rotate(Math.sin(frameCountRef.current * 0.1) * 0.3);
    ctx.fillStyle = COLORS.catBody;
    ctx.strokeStyle = '#d48a85';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.5, -size * 0.5, -size * 1.2, 0);
    ctx.quadraticCurveTo(-size * 0.5, size * 0.5, 0, 0);
    ctx.fill();
    ctx.stroke();
    // Tail stripes
    ctx.strokeStyle = 'rgba(212, 138, 133, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // --- BODY ---
    // Main Body (Ginger)
    const bodyGrad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size);
    bodyGrad.addColorStop(0, '#fffcf0'); // Cream belly
    bodyGrad.addColorStop(0.4, COLORS.catBody);
    bodyGrad.addColorStop(1, '#f4a460'); // Darker ginger edge
    
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#d48a85';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body Stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.3, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- PAWS ---
    ctx.fillStyle = '#fff'; // White paws
    ctx.beginPath();
    ctx.arc(-size * 0.6, size * 0.5, size * 0.25, 0, Math.PI * 2);
    ctx.arc(size * 0.6, size * 0.5, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- EARS ---
    const drawEar = (ex: number, angle: number) => {
      ctx.save();
      ctx.translate(ex, -size * 0.5);
      ctx.rotate(angle);
      ctx.fillStyle = COLORS.catBody;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, 0);
      ctx.quadraticCurveTo(0, -size * 0.6, size * 0.2, 0);
      ctx.fill();
      ctx.stroke();
      // Inner Ear
      ctx.fillStyle = '#ffb6c1';
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, 0);
      ctx.quadraticCurveTo(0, -size * 0.4, size * 0.1, 0);
      ctx.fill();
      ctx.restore();
    };
    drawEar(-size * 0.4, -0.3);
    drawEar(size * 0.4, 0.3);

    // --- FACE ---
    // Forehead Stripes (M Shape)
    ctx.strokeStyle = 'rgba(212, 138, 133, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -size * 0.6);
    ctx.lineTo(-5, -size * 0.45);
    ctx.lineTo(0, -size * 0.6);
    ctx.lineTo(5, -size * 0.45);
    ctx.lineTo(10, -size * 0.6);
    ctx.stroke();

    // Eyes
    const drawEye = (ex: number, ey: number) => {
      if (!isSad) {
        // Big shiny anime eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, ey, 7, 0, Math.PI * 2);
        ctx.fill();
        // Highlights
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex - 2, ey - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 2, ey + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Teary 🥺 eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, ey, 8, 0, Math.PI * 2);
        ctx.fill();
        // Tear highlight
        ctx.fillStyle = '#c2e9fb';
        ctx.beginPath();
        ctx.arc(ex, ey + 4, 4, 0, Math.PI, false);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex - 2, ey - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    drawEye(-size * 0.3, -size * 0.1);
    drawEye(size * 0.3, -size * 0.1);

    // Blush
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ff9a9e';
    ctx.beginPath();
    ctx.arc(-size * 0.5, size * 0.1, 8, 0, Math.PI * 2);
    ctx.arc(size * 0.5, size * 0.1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Muzzle (Mouth shape)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, size * 0.1);
    ctx.quadraticCurveTo(-2, size * 0.25, 0, size * 0.1);
    ctx.quadraticCurveTo(2, size * 0.25, 4, size * 0.1);
    ctx.stroke();

    // Tiny Nose
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.arc(0, size * 0.05, 3, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    const drawWhiskers = (side: number) => {
      ctx.beginPath();
      ctx.moveTo(side * size * 0.5, size * 0.1);
      ctx.lineTo(side * size * 1.0, size * 0.05);
      ctx.moveTo(side * size * 0.5, size * 0.1);
      ctx.lineTo(side * size * 1.0, size * 0.2);
      ctx.stroke();
    };
    drawWhiskers(-1);
    drawWhiskers(1);

    // --- BUTTERFLY WINGS (Front) ---
    drawWingPair('front', wingFlap);

    ctx.restore();
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update(canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);

    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      dimensionsRef.current = { width: canvas.width, height: canvas.height };
      
      // Init clouds
      if (cloudsRef.current.length === 0) {
        for (let i = 0; i < 5; i++) {
          cloudsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            scale: 0.5 + Math.random(),
            speed: 0.2 + Math.random() * 0.3
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]); // Re-run if gameState changes to ensure loops start/stop correctly if needed

  return (
    <canvas
      id="game-canvas"
      ref={canvasRef}
      className="w-full h-full block cursor-pointer"
    />
  );
};
