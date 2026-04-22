export enum GameState {
  START,
  PLAYING,
  GAME_OVER,
}

export interface Vector {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'petal';
}

export interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}
